import { ConfirmOptions, PublicKey } from '@solana/web3.js'

export const confirmOptions: ConfirmOptions = {commitment : 'finalized',preflightCommitment : 'finalized',skipPreflight : false}

export const InfoPresale = {
    pool: new PublicKey("33H3bhET7nshANnKDTK7XR6yGqXVNGQFjt8ru2ggq865"),
    programId: new PublicKey("2cGgTXB7jSzzLbDfQ8RSxDjad82BVX93adz5nFGgSRvz"),
    idl: require('./presale.json'),
    tokenMint: new PublicKey("JE2U7CButXCrt4m1cx4KLHDqaUNpBUo2dGJ1DuN1B9Se"),
    decimals: 9,
    tokenAccount: new PublicKey("DNCnMEjXwrxBNtTXcmZFAsBxiVb77gKpFLXHKxWXm13W"),
    solAccount: new PublicKey("7a6mVXVWRAFen7BF1GyqiwecZijDdTSFBRX2YFdkxFkq")
}