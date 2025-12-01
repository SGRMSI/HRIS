import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center justify-center rounded-md px-1.5 py-1">
                <AppLogoIcon className="h-8 w-8" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">TECHHUB CORP</span>
            </div>
        </>
    );
}
    