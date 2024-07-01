<script lang="ts">

    // imports ================================================================

    import UserAPI from "../core/UserAPI"
    import type { TSessionInfo } from "../../../server/src/api/_get/sessionInfo"
    import { g } from "gilded"
    import Section from "./Section.svelte";

    // State ==================================================================

    let sidebar: HTMLDivElement

    let _si: TSessionInfo | undefined
    UserAPI.sessionInfo.subscribe(si => _si = si)

    $: _username = _si ? _si.username : ''
    $: _root     = _si ? _si.root : ''

    // Animations =============================================================


    UserAPI.on('successful-login', async (type) => {

        const f1 = g.f.easeOutCirc
        const sb = g(sidebar)
        const sbc = g.m.rgbToHex(window.getComputedStyle(sidebar).borderRightColor)

        await g.time(type === 'new' ? 700 : 1000)
        
        sb.css.style('borderRightColor', '#0000')
        g.tr(500, f1, t => sb.css.style('borderRightColor', g.m.hexTransform(t, `${sbc}00`, sbc)))

        g(Array.from(sidebar.children)).forEach(async (elem, i) => {

            const e = g(elem)
            e.css.style('opacity', 0)

            await g.time(100 * i)
            g.tr(500, f1, t => {
                e.css.style('opacity', t)
                 .css.transform('translateY', g.m.slide(t, 40, 0) + 'px')
            })
            
        })

    })

</script>

<div class="sidebar" bind:this={sidebar}>

    <div class="home">
        <p class="username">
            {_username}
            <span>{_root ? 'Administrator' : ''}</span>
        </p>
        <i class="home-button fa-solid fa-house"></i>
    </div>

    <Section name="Pins"/>

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
    }

</style>