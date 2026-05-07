import { BrowserRouter } from 'react-router'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import Views from '@/views'

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" storageKey="theme">
            <Theme>
                <BrowserRouter>
                    <AuthProvider>
                        <Layout>
                            <Views />
                        </Layout>
                    </AuthProvider>
                </BrowserRouter>
                <Toaster
                    theme="light"
                    position="top-right"
                    expand
                    richColors={false}
                    style={{
                        background: '#ffffff',
                        color: '#000000',
                        border: '1px solid #e5e5e5',
                    }}
                />
            </Theme>
        </ThemeProvider>
    )
}

export default App
