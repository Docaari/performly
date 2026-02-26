'use server'

import { fetchInboxTasks as queryFetchInboxTasks } from './queries'

export async function getInboxTasksAction() {
    return await queryFetchInboxTasks()
}
