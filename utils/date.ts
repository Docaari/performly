/**
 * util/date.ts
 *
 * Fonte única de verdade para manipulação de "Hoje" no sistema Performly.
 * Resolve o problema de discrepância de fuso horário entre o UTC do Servidor Vercel
 * e o GMT-3 do Cliente (Brasil), que causava respawn antecipado/atrasado de tarefas.
 *
 * Utiliza APIs nativas (Intl.DateTimeFormat) para evitar dependências pesadas como moment.js.
 */

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Retorna a string do dia de hoje no formato YYYY-MM-DD.
 * Baseado no fuso horário local do Browser (Client Components).
 */
export function getTodayStrClient(): string {
    const now = new Date();
    // Usa timezoneOffset para ajustar corretamente o ISO string para o dia que o usuário VÊ.
    const tzOffsetMs = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - tzOffsetMs).toISOString();
    return localISO.split('T')[0];
}

/**
 * Retorna a string do dia de hoje no formato YYYY-MM-DD.
 * Força estritamente o fuso horário oficial do app (America/Sao_Paulo) no Server.
 * Garantindo que meia noite no servidor seja a meia noite do usuário base.
 */
export function getTodayStrServer(): string {
    const now = new Date();

    // Formata a data atual estritamente para o Fuso do Brasil, 
    // com formato en-CA que devolve nativamente YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: DEFAULT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    return formatter.format(now);
}

/**
 * Formata qualquer objeto Date recebido para YYYY-MM-DD usando o fuso do Server.
 * Útil para varrer ranges de datas no backend mantendo alinhamento temporal.
 */
export function formatServerDateStr(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: DEFAULT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
}
