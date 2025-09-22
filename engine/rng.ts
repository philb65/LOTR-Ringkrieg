// A simple Linear Congruential Generator (LCG) for deterministic randomness.
class SeededRNG {
    private seed: number;

    constructor(seed: string) {
        this.seed = this.hashString(seed);
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    // LCG parameters
    private m = 2 ** 32;
    private a = 1664525;
    private c = 1013904223;

    private nextFloat(): number {
        this.seed = (this.a * this.seed + this.c) % this.m;
        // The seed, after being converted to a 32-bit signed integer, can be negative.
        // `>>> 0` performs an unsigned right shift, effectively converting the signed 32-bit
        // integer to its unsigned counterpart. This ensures the result is always positive
        // and within the [0, 2^32 - 1] range, producing a float between 0 and 1.
        return (this.seed >>> 0) / this.m;
    }

    public nextInt(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
}

export default SeededRNG;