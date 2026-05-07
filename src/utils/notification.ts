import { toast } from 'sonner'

export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, {
      description,
      style: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e5e5e5',
      },
    }),

  error: (message: string, description?: string) =>
    toast.error(message, {
      description,
      style: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e5e5e5',
      },
    }),

  loading: (message: string) =>
    toast.loading(message, {
      style: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e5e5e5',
      },
    }),

  message: (message: string, description?: string) =>
    toast.message(message, {
      description,
      style: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e5e5e5',
      },
    }),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    },
  ) =>
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      style: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e5e5e5',
      },
    }),
}
