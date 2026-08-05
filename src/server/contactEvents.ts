import type { Response } from 'express'

const subscribers = new Set<Response>()

export function subscribeToContactMessages(response: Response) {
    subscribers.add(response)
    const heartbeat = setInterval(() => response.write(': ping\\n\\n'), 25000)
    response.on('close', () => {
        clearInterval(heartbeat)
        subscribers.delete(response)
    })
}

export function publishContactMessageCreated() {
    for (const response of subscribers) {
        response.write('event: contact-message-created\ndata: {}\n\n')
    }
}
