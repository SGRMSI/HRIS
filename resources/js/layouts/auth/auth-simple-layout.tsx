// import AppLogoIcon from '@/components/app-logo-icon';
// import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh items-center justify-between gap-6 bg-dark-background">
            <div className="flex h-full w-full flex-1 items-center justify-center p-20">
                <img src="/undraw_report_k55w.svg" alt="Illustration" className="max-h-svh max-w-svh object-contain" />
            </div>

            <div className="flex min-h-screen w-full max-w-lg flex-col justify-center rounded-l-lg rounded-r-none border bg-background p-16 shadow-lg dark:bg-gray-800">
                <div className="flex flex-col gap-8">
                    <div className="space-y-2 text-start">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-start text-sm text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
