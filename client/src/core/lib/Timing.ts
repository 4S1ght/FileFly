
export default {

    /**
     * Wraps a function and only lets the consumers call it once every `N` milliseconds,
     * basically creating a throttling effect.
     * @param time Cooldown time
     * @param callback Callback that fires whenever called and cooled down.
     * @returns Function
     */
    throttle: (time: number, callback: () => any) => {
        let locked = false
        const play = () => {
            if (!locked) {
                locked = true
                callback()
                setTimeout(() => { locked = false }, time)
            }
        }
        return () => play()
    },

    /**
     * Plays the callback immediately using a 0-delay timeout.  
     * This is used to desync updates from svelte re-renders.
     */
    immediate: (callback: () => any) => {
        setTimeout(callback, 0);
    }

}