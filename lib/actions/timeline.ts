'use server';

import { createClient } from '@/lib/supabase/server';
import type { TimelineTodo } from '@/types';
import type { Database } from '@/types/database';

type TimelineTodoRow = Database['public']['Tables']['timeline_todos']['Row'];

function toTimelineTodo(row: TimelineTodoRow): TimelineTodo {
    return {
        id: row.id,
        userId: row.user_id,
        timeTag: row.time_tag,
        content: row.content,
        isDeleted: row.is_deleted,
        deleteReason: row.delete_reason,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}

export async function getTimelineTodosAction(userId: string): Promise<TimelineTodo[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('timeline_todos')
        .select('*')
        .eq('user_id', userId)
        .order('time_tag', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to fetch timeline todos:', error);
        throw new Error('Timeline todos could not be fetched');
    }

    return (data || []).map(toTimelineTodo);
}

export async function addTimelineTodoAction(
    userId: string,
    timeTag: string,
    content: string
): Promise<TimelineTodo> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('timeline_todos')
        .insert({
            user_id: userId,
            time_tag: timeTag,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to insert timeline todo:', error);
        throw new Error('Timeline todo could not be added');
    }

    return toTimelineTodo(data as TimelineTodoRow);
}

export async function deleteTimelineTodoAction(
    userId: string,
    id: string,
    deleteReason: string
): Promise<TimelineTodo> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('timeline_todos')
        .update({
            is_deleted: true,
            delete_reason: deleteReason,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Failed to delete timeline todo:', error);
        throw new Error('Timeline todo could not be deleted');
    }

    return toTimelineTodo(data as TimelineTodoRow);
}

export async function restoreTimelineTodoAction(
    userId: string,
    id: string
): Promise<TimelineTodo> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('timeline_todos')
        .update({
            is_deleted: false,
            delete_reason: null, // Clear the reason upon restore
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Failed to restore timeline todo:', error);
        throw new Error('Timeline todo could not be restored');
    }

    return toTimelineTodo(data as TimelineTodoRow);
}
