import { redirect } from 'next/navigation'

export default async function PlanRedirectPage(
    props: {
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    }
) {
    const searchParams = await props.searchParams
    const qs = new URLSearchParams()

    // Pass along any existing query string parameters
    for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach(v => qs.append(key, v))
            } else {
                qs.append(key, value)
            }
        }
    }

    const queryString = qs.toString()
    const destination = queryString ? `/foco?${queryString}` : '/foco'

    redirect(destination)
}
