import { usePage } from '@inertiajs/react'

interface User {
    id: number
    name: string
    email: string
    role: {
        id: number
        name: string
        label: string
    } | null
    is_active: boolean
}

interface AuthProps {
    user: User | null
}

export function useAuth() {
    const { auth } = usePage<{ auth: AuthProps }>().props
    
    return {
        user: auth.user,
        isAuthenticated: !!auth.user,
        isAdmin: auth.user?.role?.name === 'admin',
        hasRole: (roleName: string) => auth.user?.role?.name === roleName,
        isActive: auth.user?.is_active
    }
}