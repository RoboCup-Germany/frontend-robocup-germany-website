export {ImageRef, LinkRef};

declare global
{
    interface MediaRef
    {
        id?: number;
        alt?: string;
        title?: string;
        publicUrl?: string;
    }
    
    interface ImageRef
    {
        id?: number;
        alt?: string;
        title?: string;
        publicUrl?: string;
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
