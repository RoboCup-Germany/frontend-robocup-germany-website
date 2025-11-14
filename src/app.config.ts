export default defineAppConfig({
    ui: {
        button: {
            slots: {
                base: 'tracking-[0.03em] font-display font-semibold rounded-full',
            },
            variants: {
                color: {
                    primary: '',
                    junior: '',
                    major: '',
                },
                variant: {
                    solid: '',
                    outline: '',
                },
                size: {
                    md: {
                        base: 'text-[32px] leading-[1em] px-5 py-3 md:px-6 md:pt-[12px] md:pb-[15px]',
                    },
                    lg: {
                        base: 'text-xl leading-[1em] px-6 py-2 md:px-10 md:py-2',
                    },
                },
            },
            compoundVariants: [
                {
                    color: 'primary',
                    variant: 'solid',
                    class: 'text-white bg-primary hover:bg-primary/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                },
                {
                    color: 'primary',
                    variant: 'outline',
                    class: 'ring ring-inset outline-2 text-primary hover:bg-transparent hover:outline-4 disabled:bg-transparent focus:outline-4 focus-visible:ring-3 focus-visible:ring-primary'
                },
                {
                    color: 'junior',
                    variant: 'solid',
                    class: 'text-white bg-junior hover:bg-junior/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-junior'
                },
                {
                    color: 'major',
                    variant: 'solid',
                    class: 'text-white bg-major hover:bg-major/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-major'
                },
            ],
            defaultVariants: {
                color: 'primary',
                variant: 'solid',
                size: 'md'
            },
        },
    },
})