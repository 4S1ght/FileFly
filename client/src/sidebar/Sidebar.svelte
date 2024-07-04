<script lang="ts">

    // imports ================================================================

    import type { TSessionInfo } from "../../../server/src/api/_get/sessionInfo"

    import UserAPI from "../core/UserAPI"
    import { onMount } from "svelte"
    import { g } from "gilded"
    import SimpleBar from "simplebar"

    import Section from "./Section.svelte"

    // State ==================================================================

    let sidebar: HTMLDivElement
    let sidebarContent: HTMLDivElement

    let _si: TSessionInfo | undefined
    UserAPI.sessionInfo.subscribe(si => _si = si)

    $: _username = _si ? _si.username : ''
    $: _root     = _si ? _si.root : ''

    // Animations =============================================================

    onMount(() => {
        const x = new SimpleBar(sidebarContent, {
            clickOnTrack: false,
        })
    })

    // Mounting ===============================================================

    UserAPI.on('successful-login', async (type) => {

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
            <span>{_root ? 'Administrator' : ''}</span>
        </p>
        <i class="home-button fa-solid fa-house"></i>
    </div>

    <div class="content" bind:this={sidebarContent}>
        <Section name="Pins"/>
        <Section name="Locations"/>
    </div>
    
</div>

<style lang="scss">

    .sidebar {
        height: calc(100vh - var(--s-body-padding-y) * 2);
        width: calc(var(--s-sidebar-width) - 1.5rem);
        border-right: solid 1px var(--l0-section);
        padding-right: 1.5rem;

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
                :global(*) { fill: var(--l0-fg-dim); }
            }

        }

        .content {
            width: 100%;
            height: calc(100vh - var(--s-toolbar-height) - var(--s-body-padding-y)*2 - 1.4rem);
            margin: 0.7rem 0;
            position: relative;

            :global(.simplebar-track) {
                z-index: var(--z-sidebar-scroll) !important;
            }

            &::before, &::after {
                content: '';
                display: block;
                height: 1rem;
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