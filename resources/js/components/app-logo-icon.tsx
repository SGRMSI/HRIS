import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img src="/sg_globe_logo.svg" alt="SGRMSI Logo" {...props} />
    );
}
