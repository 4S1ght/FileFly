<script lang="ts">

    // imports ================================================================

    import type { TSessionInfo } from "../../../server/src/api/_get/sessionInfo"

    import uapi from "../core/UserAPI"
    import { onMount } from "svelte"
    import { g } from "gilded"
    import SimpleBar from "simplebar"

    import Section from "./Section.svelte"
    import SectionItem from "./SectionItem.svelte"

    // State ==================================================================

    let sidebar: HTMLDivElement
    let sidebarContent: HTMLDivElement

    let _si: TSessionInfo | undefined
    uapi.sessionInfo.subscribe(si => _si = si)

    $: _username = _si ? _si.username : ''
    $: _root     = _si ? _si.root : ''

    // Animations =============================================================

    onMount(() => {
        const x = new SimpleBar(sidebarContent, {
            clickOnTrack: false,
        })
    })

    // Mounting ===============================================================

    uapi.on('successful-login', async (type) => {

        const f1 = g.f.easeOutCirc
        const sb = g(sidebar)
        const sbc = g.m.rgbToHex(window.getComputedStyle(sidebar).borderRightColor)

        // Waits to match with login screen fading off
        await g.time(type === 'new' ? 600 : 1000)
        
        sb.css.style('borderRightColor', '#0000')
        g.tr(500, f1, t => sb.css.style('borderRightColor', g.m.hexTransform(t, `${sbc}00`, sbc)))

        g(`.${sidebar.className.replace(' ', '.')} .stagger`).forEach(async (elem, i) => {

            const e = g(elem)
            e.css.style('opacity', 0)

            // Staggering
            await g.time(35 * i)

            g.tr(500, f1, t => {
                e.css.style('opacity', t)
                 .css.transform('translateY', g.m.slide(t, 40, 0) + 'px')
            })
            
        })

    })

</script>

<div class="sidebar" bind:this={sidebar}>

    <div class="home stagger">
        <p class="username">
            {_username}
            <span>{_root ? 'Administrator' : 'User'}</span>
        </p>
        <i class="home-button fa-solid fa-house"></i>
    </div>

    <div class="content" bind:this={sidebarContent}>
        <Section name="Storage" iconStyle="fa" icon="fa-hard-drive" open={true}>
            <SectionItem>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit, commodi!</p>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit, commodi!</p>
            </SectionItem>
        </Section>
        <Section name="Pinned" iconStyle="fa" icon="fa-star"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
        <Section name="Pins" iconStyle="fa" icon="fa-folder"/>
    </div>
    
</div>

<style lang="scss">

    .sidebar {
        --pad: 1.5rem;
        height: calc(100vh - var(--s-body-padding-y) * 2);
        width: calc(var(--s-sidebar-width));
        border-right: solid 1px var(--l0-section);

        & > * {
            padding-right: var(--pad);
        }

        .home {
            display: grid;
            grid-template-columns: 1fr var(--s-toolbar-button-size);
            align-items: center;
            height: var(--s-toolbar-height);

            .username {
                font-size: 1.2rem;
                margin: 0;
                line-height: 1.4rem;
            }
            .username > span {
                font-size: 0.8rem;
                color: var(--l0-fg-dim);
                display: block;
                margin: 0;
            }

            .home-button {
                font-size: var(--s-toolbar-button-size);
                cursor: pointer;
                :global(path) { fill: var(--l0-fg-dim); }
            }

        }

        .content {
            width: calc(100% - var(--pad));
            height: calc(100vh - var(--s-toolbar-height) - var(--s-body-padding-y)*2 - 1.4rem);
            margin: 0.7rem 0;
            position: relative;
            padding-right: 1.07rem;

            :global(.simplebar-track) {
                z-index: var(--z-sidebar-scroll) !important;
            }

            &::before, &::after {
                content: '';
                display: block;
                height: 0.8rem;
                width: 100%;
                position: absolute;
                z-index: var(--z-sidebar-shade);
            }

            &::before { 
                top: 0; 
                background: linear-gradient(to bottom, var(--l0-bg), #0000)
            }
            &::after { 
                bottom: 0; 
                background: linear-gradient(to top, var(--l0-bg), #0000)
            }
        }

    }

</style>