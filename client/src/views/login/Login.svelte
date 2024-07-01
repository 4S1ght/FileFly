<script lang="ts">

    // Imports ================================================================

    import Input from "./Input.svelte"
    import Checkbox from "../../components/Checkbox.svelte"

    import { g } from 'gilded'
    import { onMount } from "svelte"
    import { fade } from 'svelte/transition'

    import uapi from "../../core/UserAPI"

    // State ==================================================================

    let _username: string = ''
    let _password: string = ''
    let _long: boolean = false

    let _loadStage: string = ''
    let _loadProgress: string = ''
    let _loadItem: string = ''

    let _issue: string = ''
    let _issueCount: number = 0

    let _show = true

    let usernameInput: HTMLInputElement
    let passwordInput: HTMLInputElement
    let loader1: HTMLDivElement
    let loader2: HTMLDivElement

    // Code ===================================================================

    function focusPwd() {
        passwordInput.click()
    }

    function setIssue(issue: string) {
        if (issue === _issue) _issueCount++
        else _issueCount = 0
        _issue = issue
    }

    let awaitingRequest = false
    let loginFinished = false

    async function submit(e: Event) {
        if (e.preventDefault) e.preventDefault()

        if (awaitingRequest || loginFinished) return
        awaitingRequest = true

        const error = await uapi.login(_username, _password, _long)

        awaitingRequest = false

        if (error) {
            if (error.code === 'UA_BAD_REQUEST')      return setIssue('Server refused to handle the login request.')
            if (error.code === 'UA_LOGIN_AUTH_ERROR') return setIssue('Wrong password or username.')
            if (error.code === 'US_AUTH_ERROR')       return setIssue('Could not load the user session.')
            
            if (['US_SERVER_ERROR', 'UA_SERVER_ERROR'].includes(error.code))      
                return setIssue('An unknown server error had ocurred.')    

            return setIssue('An unknown error had ocurred.')
        }
        else {
            loginFinished = true
            setIssue("")  
            await fadeOut()
            _show = false
        }
    }

    // Animations =============================================================

    function fadeIssue(node: HTMLElement) {
		return {
			duration: 400,
            easing: g.f.easeInOutQuad,
			css: (t: number) => `
                transform: translateY(${g.m.slide(t, 10, 0)}%);
                opacity: ${t};
            `
		};
    }

    function fadeOut() {
        return new Promise<void>(resolve => {
            const f = g.f.easeInOutQuart
            g('#login-screen > form > *').forEach(async (item, i, { length }) => {
                await g.time(i * 12.5)
                const x = g(item)
                x.css.toInline('transform')
                await g.tr(600, f, t => {
                    x.css.transform('translateY', `-${25*t}%`)
                    x.css.style('filter', `blur(${3*t}px)`)
                    x.css.style('opacity', `${1-t}`)
                })
                if (i === length-1) resolve()
            })
        })
    }

    onMount(async () => {

        const f1 = g.f.easeOutQuad
        const f2 = g.f.easeInOutCubic

        const l1 = g(loader1)
        const l2 = g(loader2)

        const renewed = (await uapi.renewSession()) === undefined

        await g.time(300)

        g.tr(700, f2, t => {
            l1.css.transform('translateY', g.m.slide(t, 140, 0)+"px")
        })
        await g.tr(400, 200, f2, t => {
            l1.css.style('opacity', t)
            l1.css.style('height', g.m.slide(t, 4, 35)+'px')
        })
        await g.tr(400, 130, f1, t => {
            l1.css.style('opacity', 1-t)
            l1.css.style('height', g.m.slide(t, 35, 4)+'px')
        })

        if (renewed) {
            g.tr(400, 100, f2, t => {
                l2.css.transform('translateY', g.m.slide(t, 110, -10)+"px")
            })
            await g.tr(300, 230, f2, t => {
                l2.css.style('opacity', t)
                l2.css.style('height', g.m.slide(t, 4, 35)+'px')
            })
            await g.tr(240, f1, t => {
                l2.css.style('opacity', 1-t)
                l2.css.style('height', g.m.slide(t, 35, 4)+'px')
            })
            _show = false
        }
        else {
            g('#login-screen > form > *').forEach(async (item, i) => {
                await g.time(i * 20)
                const x = g(item)
                x.css.toInline('transform')
                await g.tr(400, f1, t => {
                    x.css.transform('translateY', `${g.m.slide(t, 35, 0)}%`)
                    x.css.style('filter', `blur(${g.m.slide(t, 3, 0)}px)`)
                    x.css.style('opacity', `${t}`)
                })
            })
        }

    })

</script>

{#if _show}
    <div id="login-screen" transition:fade={{ duration: 300 }}>
        <form on:submit={submit}>

            <h1>Welcome to <span>Filefly</span>!</h1>
            <p class="brief">A web file hosting solution for people of all technical level. Log in, or contact the administrator for a password reset.</p>
            <br>

            <Input placeholder="Username" type="text"     bind:value={_username} bind:input={usernameInput} on:enter={focusPwd} />
            <Input placeholder="Password" type="password" bind:value={_password} bind:input={passwordInput} on:enter={submit} />
        
            <div class="row">
                <div class="settings">
                    <Checkbox bind:checked={_long}/>
                    <span>Remember me</span>
                </div>
                <button type="submit">
                    <span>Login</span>
                    <i class="ico fa-solid fa-arrow-right"></i>
                </button>
            </div>

            {#if _issue}
                <div class="issue" transition:fadeIssue>
                    <p>{_issue}</p>
                    <p class="ic">{_issueCount ? 'x'+_issueCount : ''}</p>
                </div>
            {/if}

        </form>

        <div class="loader l1" bind:this={loader1}></div>
        <div class="loader l2" bind:this={loader2}></div>

    </div>
{/if}

<style lang="scss">

    #login-screen {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100%;
        background-color: var(--l0-bg);
        overflow: auto;
        z-index: var(--z-login);

        & > :global(form > *) {
            opacity: 0;
        }

        form {
            max-width: 330px;
            margin: 0 auto;
            padding-top: 5rem;
        }

        h1 {
            font-weight: 300;
            color: var(--l0-text-bright);
            span {
                background: linear-gradient(132deg, var(--theme-1) 0%, var(--theme-2) 100%);
                background-clip: text;
                color: transparent;
                font-weight: 700;
            }
        }

        p.brief {
            color: var(--l0-fg-dim);
        }

        .row {
            display: flex;
            gap: 1rem;
        }

        .settings {
            width: 60%;
            display: flex;
            align-items: center;
            span {
                padding: 0;
                margin: 0;
                line-height: 1em;
                margin-left: 1em;
            }
        }

        button {
            border: none;
            background-color: var(--l1-bg);
            padding: 1em 2em;
            border-radius: 10px;
            position: relative;
            width: 40%;
            transition: background-color 0.2s, color 0.2s;
            cursor: pointer;

            .ico {
                font-size: 1rem;
                position: absolute;
                opacity: 0;
                padding-left: 0;
                top: 50%;
                transform: translateX(130%) translateY(-50%) scale(0.8);
                transition: opacity 0.15s, transform 0.2s;
            }
            span {
                transition: transform 0.2s;
                display: inline-block;
            }

            &:hover {
                background-color: var(--l2-bg);
                .ico {
                    opacity: 1;
                    transform: translateY(-50%);
                }
                span {
                    transform: translateX(-0.6em) ;
                }
            }

            &:focus-visible {
                outline: solid 1px var(--theme-1);
            }

        }

        .issue {
            width: 100%;
            padding: 1rem 0 1.3rem 0;
            margin-top: 3rem;
            position: relative;
            opacity: 1;

            border: 1px solid transparent;
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            background: 
                linear-gradient(to bottom, var(--l0-bg), var(--l0-bg)), 
                linear-gradient(to bottom, var(--l0-accent), var(--l0-bg)); 
            background-clip: padding-box, border-box;
            background-origin: padding-box, border-box;

            p {
                color: var(--l0-fg-bright);
                text-align: center;
                padding: 0 1.5rem 1em 1.5rem;
            }

            p.ic {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                color: var(--l0-fg-dim);
                padding: 0;
            }
        }

        .loader {
            position: absolute;
            top: 13rem;
            left: calc(50% - 2px);
            height: 40px;
            width: 4px;
            border-radius: 4px;
            background-color: var(--l0-fg-bright);
            z-index: var(--z-login-loader);
            opacity: 0;
        }

    }

</style>