export {ImageRef, LinkRef};

declare global
{
    interface ResponsiveImageSource
    {
        width: number;
        height: number;
        url: string;
        publicUrl: string;
    }

    interface ResponsiveImageVariant
    {
        srcset: string;
        sources: ResponsiveImageSource[];
    }

    interface ResponsiveImageVariants
    {
        default?: ResponsiveImageVariant;
        small?: ResponsiveImageVariant;
        [cropVariant: string]: ResponsiveImageVariant | undefined;
    }

    interface MediaRef
    {
        id?: number;
        alt?: string;
        title?: string;
        description?: string;
        publicUrl?: string;
        url?: string;
        originalUrl?: string;
        creator?: string;
        responsive?: ResponsiveImageVariants;
    }
    
    interface ImageRef
    {
        id?: number;
        alt?: string;
        alternative?: string;
        title?: string;
        description?: string;
        publicUrl?: string;
        creator?: string;
        responsive?: ResponsiveImageVariants;
    }

    interface FileObject extends ImageRef
    {
        alternative?: string;
        publicUrl?: string;
        url?: string;
        originalUrl?: string;
    }

    interface SiteContactConfig
    {
        name?: string | null;
        mail?: string | null;
        email?: string | null;
        phone?: string | null;
    }

    interface SiteConfig
    {
        rootPageUid?: number;
        contact?: SiteContactConfig | null;
        headerLogo?: FileObject | null;
        footerLogo?: FileObject | null;
    }

    interface GlobalConfig
    {
        title?: string;
        contact?: SiteContactConfig | null;
        siteConfig?: SiteConfig | null;
    }
    
    interface LinkRef
    {
        url?: string | null;
        target?: string | null;
        type?: string | null;
        title?: string | null;
        config?: { parameter?: string | null } | null;
        attr?: { href?: string | null } | null;
    }

    
    interface FooterItem { label: string; url?: string }
}
