import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'

type ToolName = 'create_task'|'create_note'|'create_transaction'|'update_book_progress'
type ProposedAction = { name: ToolName; arguments: Record<string, unknown> }
type OpenAIResponse = { output?: Array<{ type?: string; name?: ToolName; arguments?: string; content?: Array<{type?:string;text?:string}> }>; error?: {message?:string} }

async function auth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user ? null : { supabase, user }
}

export async function GET(request: Request) {
  const ctx = await auth()
  if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const conversationId = new URL(request.url).searchParams.get('conversationId')
  const conversations = await ctx.supabase.from('ai_conversations').select('id,title,created_at,updated_at').eq('user_id', ctx.user.id).order('updated_at', { ascending: false }).limit(30)
  if (conversations.error) return NextResponse.json({ error: conversations.error.message }, { status: 500 })
  const selected = conversationId ?? conversations.data?.[0]?.id
  const messages = selected ? await ctx.supabase.from('ai_messages').select('id,role,content,sources,proposed_action,action_status,created_at').eq('user_id', ctx.user.id).eq('conversation_id', selected).order('created_at').limit(100) : { data: [], error: null }
  if (messages.error) return NextResponse.json({ error: messages.error.message }, { status: 500 })
  return NextResponse.json({ conversations: conversations.data ?? [], conversationId: selected ?? null, messages: messages.data ?? [] })
}

async function executeAction(ctx: NonNullable<Awaited<ReturnType<typeof auth>>>, proposal: ProposedAction) {
  const args = proposal.arguments
  if (proposal.name === 'create_task') {
    const title = String(args.title ?? '').trim().slice(0, 160)
    if (!title) throw new Error('Título da tarefa inválido.')
    const category = ['fixed','today','carryover'].includes(String(args.category)) ? String(args.category) : 'today'
    const { error } = await ctx.supabase.from('commitments').insert({ user_id: ctx.user.id, title, kind: category === 'fixed' ? 'habit' : 'task', category, priority: 2, scheduled_date: args.scheduled_date ? String(args.scheduled_date) : null, start_time: args.start_time ? String(args.start_time) : null, duration_minutes: Math.max(5, Math.min(1440, Number(args.duration_minutes) || 30)) })
    if (error) throw error
    return `Tarefa “${title}” registrada na agenda.`
  }
  if (proposal.name === 'create_note') {
    const title = String(args.title ?? 'Anotação').trim().slice(0, 240)
    const content = String(args.content ?? '').trim().slice(0, 12000)
    if (!content) throw new Error('Conteúdo da anotação inválido.')
    const { error } = await ctx.supabase.from('knowledge_notes').insert({ user_id: ctx.user.id, title, content })
    if (error) throw error
    return `Anotação “${title}” registrada.`
  }
  if (proposal.name === 'create_transaction') {
    const description = String(args.description ?? '').trim().slice(0, 240)
    const amount = Number(args.amount)
    if (!description || !Number.isFinite(amount) || amount <= 0) throw new Error('Dados da transação inválidos.')
    const { error } = await ctx.supabase.from('transactions').insert({ user_id: ctx.user.id, description, amount, type: args.type === 'income' ? 'income' : 'expense', category: String(args.category ?? 'Outros').slice(0, 80), occurred_at: args.occurred_at ? String(args.occurred_at) : new Date().toISOString() })
    if (error) throw error
    return `Transação “${description}” registrada.`
  }
  const bookId = String(args.book_id ?? '')
  const currentPage = Math.max(0, Math.floor(Number(args.current_page)))
  if (!bookId || !Number.isFinite(currentPage)) throw new Error('Livro ou página inválidos.')
  const { data, error } = await ctx.supabase.from('books').update({ current_page: currentPage, status: 'reading', updated_at: new Date().toISOString() }).eq('id', bookId).eq('user_id', ctx.user.id).select('title').single()
  if (error) throw error
  return `Leitura de “${data.title}” atualizada para a página ${currentPage}.`
}

export async function POST(request: Request) {
  try {
    const ctx = await auth()
    if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const body = await request.json() as { message?: unknown; conversationId?: string; confirmMessageId?: string; confirm?: boolean }

    if (body.confirmMessageId) {
      const { data: pending, error } = await ctx.supabase.from('ai_messages').select('id,conversation_id,proposed_action,action_status').eq('id', body.confirmMessageId).eq('user_id', ctx.user.id).single()
      if (error || !pending || pending.action_status !== 'pending' || !pending.proposed_action) return NextResponse.json({ error: 'Ação pendente não encontrada.' }, { status: 404 })
      if (!body.confirm) {
        await ctx.supabase.from('ai_messages').update({ action_status: 'cancelled' }).eq('id', pending.id).eq('user_id', ctx.user.id)
        return NextResponse.json({ answer: 'Tudo bem — nenhuma alteração foi feita.', actionStatus: 'cancelled' })
      }
      try {
        const result = await executeAction(ctx, pending.proposed_action as unknown as ProposedAction)
        await ctx.supabase.from('ai_messages').update({ action_status: 'confirmed' }).eq('id', pending.id).eq('user_id', ctx.user.id)
        await ctx.supabase.from('ai_messages').insert({ user_id: ctx.user.id, conversation_id: pending.conversation_id, role: 'assistant', content: result })
        await ctx.supabase.from('ai_audit_log').insert({ user_id: ctx.user.id, channel: 'web', action: 'ai_write_confirmed', metadata: pending.proposed_action })
        return NextResponse.json({ answer: result, actionStatus: 'confirmed' })
      } catch (actionError) {
        await ctx.supabase.from('ai_messages').update({ action_status: 'failed' }).eq('id', pending.id).eq('user_id', ctx.user.id)
        throw actionError
      }
    }

    if (typeof body.message !== 'string' || body.message.trim().length < 2 || body.message.length > 2000) return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Configure OPENAI_API_KEY no servidor.' }, { status: 503 })
    const { data: recent } = await ctx.supabase.from('ai_audit_log').select('id').eq('user_id', ctx.user.id).gte('created_at', new Date(Date.now()-3600000).toISOString())
    if ((recent?.length??0) >= 20) return NextResponse.json({ error: 'Limite temporário atingido. Tente novamente em alguns minutos.' }, { status: 429 })

    let conversationId = body.conversationId
    if (!conversationId) {
      const { data, error } = await ctx.supabase.from('ai_conversations').insert({ user_id: ctx.user.id, title: body.message.trim().slice(0, 70) }).select('id').single()
      if (error) throw error
      conversationId = data.id
    }
    await ctx.supabase.from('ai_messages').insert({ user_id: ctx.user.id, conversation_id: conversationId, role: 'user', content: body.message.trim() })

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const [profileR, commitmentsR, eventsR, goalsR, booksR, notesR, transactionsR, historyR] = await Promise.all([
      ctx.supabase.from('profiles').select('display_name,purpose,ai_permissions').eq('id',ctx.user.id).single(),
      ctx.supabase.from('commitments').select('id,title,category,priority,scheduled_date,start_time,duration_minutes').eq('user_id',ctx.user.id).eq('active',true).limit(40),
      ctx.supabase.from('commitment_events').select('commitment_id,status,completed_at').eq('user_id',ctx.user.id).eq('scheduled_for',today),
      ctx.supabase.from('goals').select('id,title,progress,deadline,status').eq('user_id',ctx.user.id).neq('status','archived').limit(20),
      ctx.supabase.from('books').select('id,title,author,status,current_page,total_pages').eq('user_id',ctx.user.id).limit(30),
      ctx.supabase.from('knowledge_notes').select('id,title,content,updated_at').eq('user_id',ctx.user.id).order('updated_at',{ascending:false}).limit(15),
      ctx.supabase.from('transactions').select('description,amount,type,category,occurred_at').eq('user_id',ctx.user.id).order('occurred_at',{ascending:false}).limit(20),
      ctx.supabase.from('ai_messages').select('role,content').eq('user_id',ctx.user.id).eq('conversation_id',conversationId).order('created_at',{ascending:false}).limit(12),
    ])
    const firstError = [profileR,commitmentsR,eventsR,goalsR,booksR,notesR,transactionsR,historyR].find(result=>result.error)?.error
    if (firstError) throw firstError
    const permissions = (profileR.data?.ai_permissions??{}) as Record<string,boolean>
    const eventMap = new Map((eventsR.data??[]).map(event=>[event.commitment_id,event]))
    const context: Record<string, unknown> = { today, timezone:'America/Sao_Paulo', name:profileR.data?.display_name, purpose:profileR.data?.purpose }
    const sources: string[] = []
    if (permissions.tasks!==false) { context.commitments=(commitmentsR.data??[]).map(item=>({...item,status_today:eventMap.get(item.id)?.status??'pending'}));sources.push('commitments') }
    if (permissions.goals!==false) { context.goals=goalsR.data;sources.push('goals') }
    if (permissions.books!==false) { context.books=booksR.data;context.notes=notesR.data;sources.push('books','notes') }
    if (permissions.finance===true) { context.transactions=transactionsR.data;sources.push('finance') }

    const input = [...(historyR.data??[]).reverse().map(item=>({role:item.role,content:item.content})),{role:'user',content:`CONTEXTO ATUAL:\n${JSON.stringify(context)}\n\nPEDIDO:\n${body.message.trim()}`}]
    const tools = [
      {type:'function',name:'create_task',description:'Propõe criar uma tarefa, hábito ou compromisso na agenda do usuário.',strict:true,parameters:{type:'object',properties:{title:{type:'string'},category:{type:'string',enum:['fixed','today','carryover']},scheduled_date:{type:['string','null']},start_time:{type:['string','null']},duration_minutes:{type:'number'}},required:['title','category','scheduled_date','start_time','duration_minutes'],additionalProperties:false}},
      {type:'function',name:'create_note',description:'Propõe registrar uma anotação de conhecimento.',strict:true,parameters:{type:'object',properties:{title:{type:'string'},content:{type:'string'}},required:['title','content'],additionalProperties:false}},
      {type:'function',name:'create_transaction',description:'Propõe registrar uma entrada ou saída financeira.',strict:true,parameters:{type:'object',properties:{description:{type:'string'},amount:{type:'number'},type:{type:'string',enum:['income','expense']},category:{type:'string'},occurred_at:{type:['string','null']}},required:['description','amount','type','category','occurred_at'],additionalProperties:false}},
      {type:'function',name:'update_book_progress',description:'Propõe atualizar a página atual de um livro existente.',strict:true,parameters:{type:'object',properties:{book_id:{type:'string'},current_page:{type:'number'}},required:['book_id','current_page'],additionalProperties:false}},
    ]
    const response = await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL??'gpt-5.6-luna',reasoning:{effort:'low'},max_output_tokens:700,store:false,tools,instructions:'Você é a Apri, copiloto de evolução pessoal. Responda em português do Brasil. Use apenas o contexto autorizado. Para registrar ou alterar dados, use exatamente uma ferramenta; nunca afirme que gravou algo. A aplicação solicitará confirmação antes de executar. Em perguntas sobre o que falta hoje, exclua status_today completed. Datas e horários devem usar o fuso informado. Não diagnostique nem dê aconselhamento financeiro profissional.',input})})
    const payload = await response.json() as OpenAIResponse
    if (!response.ok) throw new Error(payload.error?.message??'Falha ao consultar a IA')
    const call = payload.output?.find(item=>item.type==='function_call'&&item.name)
    if (call?.name && call.arguments) {
      const proposal: ProposedAction = { name:call.name, arguments:JSON.parse(call.arguments) as Record<string,unknown> }
      const labels: Record<ToolName,string>={create_task:'registrar esta tarefa na agenda',create_note:'salvar esta anotação',create_transaction:'registrar esta transação',update_book_progress:'atualizar o progresso de leitura'}
      const content=`Posso ${labels[proposal.name]}. Confirme para eu alterar seus dados.`
      const { data: message, error } = await ctx.supabase.from('ai_messages').insert({user_id:ctx.user.id,conversation_id:conversationId,role:'assistant',content,sources:sources as Json,proposed_action:proposal as unknown as Json,action_status:'pending'}).select('id').single()
      if (error) throw error
      return NextResponse.json({answer:content,sources,conversationId,proposal,messageId:message.id})
    }
    const answer=payload.output?.flatMap(item=>item.content??[]).filter(item=>item.type==='output_text').map(item=>item.text??'').join('\n').trim()
    if(!answer)throw new Error('A IA não retornou uma resposta.')
    await ctx.supabase.from('ai_messages').insert({user_id:ctx.user.id,conversation_id:conversationId,role:'assistant',content:answer,sources:sources as Json})
    await ctx.supabase.from('ai_conversations').update({updated_at:new Date().toISOString()}).eq('id',conversationId).eq('user_id',ctx.user.id)
    await ctx.supabase.from('ai_audit_log').insert({user_id:ctx.user.id,channel:'web',action:'chat_response',metadata:{model:process.env.OPENAI_MODEL??'gpt-5.6-luna',sources}})
    return NextResponse.json({answer,sources,conversationId})
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:'Apri indisponível'},{status:500})
  }
}
