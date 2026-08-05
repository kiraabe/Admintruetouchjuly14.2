import type { Response } from 'express'

const subscribers = new Set<Response>()

export function subscribeToContactMessages(response: Response) {
    subscribers.add(response)
    console.info(`[SSE] Client subscribed, total subscribers: ${subscribers.size}`)
    const heartbeat = setInterval(() => response.write(': ping\n\n'), 25000)
    response.on('close', () => {
        clearInterval(heartbeat)
        subscribers.delete(response)
        console.info(`[SSE] Client disconnected, total subscribers: ${subscribers.size}`)
    })
}

export function publishContactMessageCreated() {
    console.info(`[SSE] Publishing contact-message-created event to ${subscribers.size} subscribers`)
    for (const response of subscribers) {
        response.write('event: contact-message-created\ndata: {}\n\n')
    }
}
