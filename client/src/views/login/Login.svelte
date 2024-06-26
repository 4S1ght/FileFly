<script lang="ts">

    // Imports ================================================================

    import Input from "./Input.svelte"
    import Checkbox from "../../components/Checkbox.svelte"
    import { onMount } from "svelte"
    import uapi from "../../core/UserAPI"

    // State ==================================================================

    let _username = ""
    let _password = ""
    let _useLongSession = false

    /** Displays in which part is currently the loading process. Loading user 
     * data, extensions, etc... */
    let _loadStage = ""
    /** Displays the progress of the current loading stage. */
    let _loadStageProgress = 0
    /** Displays what item is currently being loaded.*/
    let _loadItem = ""
    /** Displays login and loading issues. */
    let _loadIssue = ""
    /** Displays a counter to signify that an issue has happened more than once. */
    let _loadIssueCount = 0

    // Code ===================================================================

    let usernameInput: HTMLInputElement
    let passwordInput: HTMLInputElement

    function focusPwd() {
        passwordInput.click()
    }

    onMount(() => {
        usernameInput.focus()
    })

    function setIssue(issue: string) {
        if (issue === _loadIssue) _loadIssueCount++
        else _loadIssueCount = 0
        _loadIssue = issue
    }

    async function submit(e: SubmitEvent | CustomEvent) {

        if (e.preventDefault) e.preventDefault()
        const error = await uapi.login(_username, _password, _useLongSession)
            
        if (error) {
            if (error.code === 'UA_LOGIN_UNKNOWN_ERR') return setIssue('An unknown client error had ocurred.')
            if (error.meta.statusCode === 400) return setIssue('Bad request error.')
            if (error.meta.statusCode === 401) return setIssue('Wrong password or username.')
            if (error.meta.statusCode === 401) return setIssue('An unknown server error had ocurred.')
            return setIssue('An unknown error had ocurred.')
        }
        else {
            setIssue("")
        }
        
    }

</script>

<div class="login">
    <form class="login-widget" on:submit={submit}>

        <div class="banner">
        </div>

        <div class="content">
            <h1>Welcome to <b>Filefly</b>!</h1>
            <p class="brief">A web file hosting solution for people of all technical level. Log in, or contact the administrator for a password reset.</p>
            <Input placeholder="username" type="text"     bind:value={_username} bind:input={usernameInput} on:enter={focusPwd} />
            <Input placeholder="password" type="password" bind:value={_password} bind:input={passwordInput} on:enter={submit} />
            <div class="data-row">
                <button type="submit">Login</button>
                {#if _loadStage}
                    <div class="load-status">
                        <p class="load-info">{_loadStage} <span>{_loadStageProgress ? _loadStageProgress + '%' : ''}</span></p>
                        <p class="load-item">{_loadItem}</p>
                        <div class="loader">
                            <div></div>
                        </div>
                    </div>
                {/if}
            </div>
            <div class="checkbox">
                <Checkbox bind:checked={_useLongSession}/>
                <p>Remember me</p>
            </div> 
            {#if _loadIssue}
                <p class="login-feedback">
                    <i class="fa-solid fa-triangle-exclamation icon"/>
                    {_loadIssue} {_loadIssueCount ? `(x${_loadIssueCount})` : ''}
                </p>
            {:else}
                <p class="login-feedback-placeholder"></p>
            {/if}
        </div>

    </form>
</div>

<style lang="scss">

    .login {
        height: 100vh;
        width: 100%;
        position: fixed;
        top: 0; left: 0;
        z-index: var(--z-login);
        background-color: var(--l2-bg);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .login-widget {
        background-color: var(--l1-bg);
        border-radius: 15px;
        box-shadow: 0 0 50px rgba(71, 89, 101, 0.2);
        display: grid;
        grid-template-columns: 200px 1fr;
        margin: 1.5rem;

        .banner {
            background: linear-gradient(0deg, rgba(236,114,114,1) 0%, rgba(232,129,191,1) 100%);
            height: 100%;
            width: 200px;
            border-top-left-radius: 15px;
            border-bottom-left-radius: 15px;
        }

        .content {
            padding: 4rem 2.5rem;
            max-width: 360px;

            > h1 {
                font-size: 2rem;
                font-weight: 300;
                margin-top: 0;
                color: var(--l1-text-light);
                > b {
                    color: var(--l1-heading);
                }
            }

            > p.brief {
                color: var(--l1-text-light);
                max-width: 90%;
                margin-bottom: 2.3rem;
            }

            button {
                background: none;
                border: solid 1px var(--l1-outline);
                border-radius: 10px;
                padding: 1rem;
                font-size: 1rem;
                cursor: pointer;
                &:hover {
                    background-color: var(--l1-highlight);
                }
            }

            .data-row {
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 1rem;
                margin-top: 2.5rem;
                align-items: center;

                .load-status {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;

                    .load-info {
                        font-size: 0.8rem;
                        margin: 0;
                        color: var(--l1-text-light);
                        position: relative;
                        > span { 
                            position: absolute;
                            right: 0;
                        }
                    }
                    .load-item {
                        font-size: 0.8rem;
                        margin: 0 0 0.4rem 0;
                        color: var(--l1-text);
                    }

                    .loader {
                        height: 4px;
                        width: 100%;
                        border-radius: 4px;
                        background-color: var(--l1-outline);
                        > div {
                            height: 100%;
                            width: 30%;
                            border-radius: 4px;
                            background-color: var(--l1-mc);
                        }
                    }
                }


            }

            .checkbox {
                display: flex;
                margin-top: 2rem;
                p { 
                    padding: 0;
                    margin: 0 0 0 0.5rem;
                }
            }

            .login-feedback-placeholder {
                margin-top: 2rem;
                padding: 1rem 1.5rem;
            }
            .login-feedback {
                text-align: center;
                margin-top: 2rem;
                border: solid 1px var(--l1-outline);
                border-radius: 10px;
                padding: 1rem 1.5rem;
                position: relative;

                .icon {
                    color: var(--l1-outline);
                    position: absolute;
                    bottom: -1.2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 1.2rem;
                    background-color: var(--l1-bg);
                    padding: 0.6rem 0.2rem;
                }
            }

        }

    }

</style>
