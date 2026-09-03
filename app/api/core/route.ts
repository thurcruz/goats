import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Goal, GoalCategory, Task, TaskCategory } from '@/lib/types'

const categoryToDb: Record<TaskCategory, 'fixed'|'today'|'carryover'> = { fixa:'fixed', hoje:'today', repasse:'carryover' }
const categoryFromDb: Record<string, TaskCategory> = { fixed:'fixa', today:'hoje', carryover:'repasse' }

async function context() {
  const supabase = await createSupabaseServerClient(); const { data:{user}, error } = await supabase.auth.getUser()
  return error || !user ? null : { supabase, user }
}

export async function GET() {
  try {
    const ctx = await context(); if (!ctx) return NextResponse.json({error:'Não autenticado'},{status:401})
    const today = new Date().toISOString().slice(0,10); const periodStart = new Date(Date.now()-29*86400000).toISOString().slice(0,10)
    const [goalsResult, milestonesResult, commitmentsResult, eventsResult] = await Promise.all([
      ctx.supabase.from('goals').select('id,title,description,category,deadline,progress,status,created_at').eq('user_id',ctx.user.id).neq('status','archived').order('created_at'),
      ctx.supabase.from('goal_milestones').select('id,goal_id,title,completed,due_date,position').eq('user_id',ctx.user.id).order('position'),
      ctx.supabase.from('commitments').select('id,goal_id,title,category,created_at,scheduled_date,start_time,duration_minutes').eq('user_id',ctx.user.id).eq('active',true).order('created_at'),
      ctx.supabase.from('commitment_events').select('commitment_id,status,completed_at,scheduled_for').eq('user_id',ctx.user.id).gte('scheduled_for',periodStart).lte('scheduled_for',today),
    ])
    const error = goalsResult.error ?? milestonesResult.error ?? commitmentsResult.error ?? eventsResult.error
    if (error) return NextResponse.json({error:error.message},{status:500})
    const goals: Goal[] = (goalsResult.data??[]).map(row=>({ id:row.id,title:row.title,description:row.description,category:row.category as GoalCategory,deadline:row.deadline??'',progress:row.progress,milestones:(milestonesResult.data??[]).filter(item=>item.goal_id===row.id).map(item=>({id:item.id,title:item.title,completed:item.completed,dueDate:item.due_date??undefined})),linkedTasks:(commitmentsResult.data??[]).filter(item=>item.goal_id===row.id).map(item=>item.id) }))
    const periodEvents=eventsResult.data??[];const eventMap = new Map(periodEvents.filter(event=>event.scheduled_for===today).map(event=>[event.commitment_id,event]))
    const tasks: Task[] = (commitmentsResult.data??[]).map(row=>{const event=eventMap.get(row.id);return {id:row.id,title:row.title,category:categoryFromDb[row.category]??'hoje',completed:event?.status==='completed',completedAt:event?.completed_at??undefined,createdAt:row.created_at,goalId:row.goal_id??undefined,scheduledDate:row.scheduled_date??undefined,startTime:row.start_time?.slice(0,5)??undefined,durationMinutes:row.duration_minutes??undefined}})
    const completedDates=new Set(periodEvents.filter(event=>event.status==='completed').map(event=>event.scheduled_for));let streak=0;for(let offset=0;offset<30;offset++){const date=new Date(Date.now()-offset*86400000).toISOString().slice(0,10);if(completedDates.has(date))streak++;else if(offset>0)break}
    const metrics={streak,completedCommitments:periodEvents.filter(event=>event.status==='completed').length,totalCommitments:periodEvents.length,carriedCommitments:periodEvents.filter(event=>event.status==='carried').length,completedGoals:(goalsResult.data??[]).filter(goal=>goal.status==='completed'||goal.progress===100).length,periodDays:30}
    return NextResponse.json({goals,tasks,metrics})
  } catch (error) { return NextResponse.json({error:error instanceof Error?error.message:'Dados indisponíveis'},{status:503}) }
}

export async function POST(request:Request) {
  try {
    const ctx=await context(); if(!ctx)return NextResponse.json({error:'Não autenticado'},{status:401})
    const body=await request.json() as {action?:string;task?:Task;goal?:Goal;id?:string;eventDate?:string}
    if(body.action==='addTask'&&body.task){const task=body.task;if(!task.title.trim()||task.title.length>160)return NextResponse.json({error:'Tarefa inválida'},{status:400});const {error}=await ctx.supabase.from('commitments').insert({id:task.id,user_id:ctx.user.id,goal_id:task.goalId??null,title:task.title.trim(),kind:task.category==='fixa'?'habit':'task',category:categoryToDb[task.category],priority:2,scheduled_date:task.scheduledDate??null,start_time:task.startTime??null,duration_minutes:task.durationMinutes??null});if(error)throw error}
    else if(body.action==='updateTask'&&body.task){const task=body.task;const {error}=await ctx.supabase.from('commitments').update({title:task.title.trim(),goal_id:task.goalId??null,category:categoryToDb[task.category],scheduled_date:task.scheduledDate??null,start_time:task.startTime??null,duration_minutes:task.durationMinutes??null,updated_at:new Date().toISOString()}).eq('id',task.id).eq('user_id',ctx.user.id);if(error)throw error;const eventDate=body.eventDate??task.scheduledDate??new Date().toISOString().slice(0,10);const {error:eventError}=await ctx.supabase.from('commitment_events').upsert({user_id:ctx.user.id,commitment_id:task.id,scheduled_for:eventDate,status:task.completed?'completed':'pending',completed_at:task.completed?(task.completedAt??new Date().toISOString()):null,updated_at:new Date().toISOString()},{onConflict:'commitment_id,scheduled_for'});if(eventError)throw eventError}
    else if(body.action==='deleteTask'&&body.id){const {error}=await ctx.supabase.from('commitments').delete().eq('id',body.id).eq('user_id',ctx.user.id);if(error)throw error}
    else if(body.action==='addGoal'&&body.goal){const goal=body.goal;if(!goal.title.trim()||goal.title.length>160)return NextResponse.json({error:'Meta inválida'},{status:400});const {error}=await ctx.supabase.from('goals').insert({id:goal.id,user_id:ctx.user.id,title:goal.title.trim(),description:goal.description,category:goal.category,deadline:goal.deadline||null,progress:goal.progress});if(error)throw error}
    else if(body.action==='updateGoal'&&body.goal){const goal=body.goal;const {error}=await ctx.supabase.from('goals').update({title:goal.title.trim(),description:goal.description,category:goal.category,deadline:goal.deadline||null,progress:goal.progress,updated_at:new Date().toISOString()}).eq('id',goal.id).eq('user_id',ctx.user.id);if(error)throw error;for(const milestone of goal.milestones){const {error:milestoneError}=await ctx.supabase.from('goal_milestones').upsert({id:milestone.id,user_id:ctx.user.id,goal_id:goal.id,title:milestone.title,completed:milestone.completed,due_date:milestone.dueDate??null,completed_at:milestone.completed?new Date().toISOString():null},{onConflict:'id'});if(milestoneError)throw milestoneError}}
    else if(body.action==='deleteGoal'&&body.id){const {error}=await ctx.supabase.from('goals').delete().eq('id',body.id).eq('user_id',ctx.user.id);if(error)throw error}
    else return NextResponse.json({error:'Ação inválida'},{status:400})
    return NextResponse.json({ok:true})
  } catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível salvar'},{status:500})}
}
