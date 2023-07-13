import { FC, useCallback, useMemo, ReactNode } from 'react';
import { ProgramContext } from './useProgram'
import { InfoPresale, confirmOptions } from './constants';
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import * as anchor from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_CLOCK_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { sendTransactionWithRetry } from './utility';
import { AccountLayout, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createCloseAccountInstruction, createInitializeAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';


export interface ProgramProviderProps{
    children : ReactNode
}

export const ProgramProvider: FC<ProgramProviderProps> = ({children}) => {
    const wallet = useWallet()
    const {publicKey} = useWallet()
    const {connection: conn} = useConnection()
    
    const [program] = useMemo(()=>{
        const provider = new anchor.AnchorProvider(conn, wallet as any, confirmOptions)
        const program =  new anchor.Program(InfoPresale.idl, InfoPresale.programId, provider)
        return [program]
    },[conn, wallet])

    const getPresalePoolData = async() => {
        try{
            let poolData = await program.account.pool.fetch(InfoPresale.pool)
            poolData = {
                ...poolData,
                hardCap: poolData.hardCap.toNumber(),
                softCap: poolData.softCap.toNumber(),
                whitelistPriceNumerator: poolData.whitelistPriceNumerator.toNumber(),
                whitelistPriceDenominator: poolData.whitelistPriceDenominator.toNumber(),
                whitelistStartTime: poolData.whitelistStartTime.toNumber()*1000,
                whitelistEndTime: poolData.whitelistEndTime.toNumber()*1000,
                whitelistMaxCommit: poolData.whitelistMaxCommit.toNumber(),
                whitelistMinCommit: poolData.whitelistMinCommit.toNumber(),
                whitelistCommitAmount: poolData.whitelistCommitAmount.toNumber(),
                priceNumerator: poolData.priceNumerator.toNumber(),
                priceDenominator: poolData.priceDenominator.toNumber(),
                startTime: poolData.startTime.toNumber()*1000,
                endTime: poolData.endTime.toNumber()*1000,
                maxCommit: poolData.maxCommit.toNumber(),
                minCommit: poolData.minCommit.toNumber(),
                commitAmount: poolData.commitAmount.toNumber()
            }
            // console.log(poolData)
            return poolData
        }catch(err){
            console.log(err)
            return null
        }
    }

    const getUserData = async(owner : PublicKey) => {
        try{
            let [userAccount,] = PublicKey.findProgramAddressSync([owner.toBuffer(), InfoPresale.pool.toBuffer()], InfoPresale.programId)
            let userData = await program.account.userData.fetch(userAccount)
            userData = {
                ...userData,
                whitelistCommitAmount: userData.whitelistCommitAmount.toNumber(),
                commitAmount: userData.commitAmount.toNumber()
            }
            // console.log(userData)
            return userData
        }catch(err){
            return null
        }
    }

    const whitelistCommit = useCallback(async(amount : number) => {
        let address = publicKey!
        let instructions: TransactionInstruction[] = []
        let [userAccount, bump] = PublicKey.findProgramAddressSync([address.toBuffer(), InfoPresale.pool.toBuffer()], InfoPresale.programId)
        if((await conn.getAccountInfo(userAccount)) == null){
            instructions.push(program.instruction.initUserData(address, new anchor.BN(bump),{
                accounts:{
                    payer: address,
                    pool: InfoPresale.pool,
                    userData: userAccount,
                    systemProgram: SystemProgram.programId
                }
            }))
        }
        const accountRentExempt = await conn.getMinimumBalanceForRentExemption(AccountLayout.span)
        const newAccount = Keypair.generate()
        instructions.push(SystemProgram.createAccount({
            fromPubkey: address,
            newAccountPubkey: newAccount.publicKey,
            lamports: amount*LAMPORTS_PER_SOL+accountRentExempt*3,
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
        }))
        instructions.push(createInitializeAccountInstruction(newAccount.publicKey, NATIVE_MINT, address))
        instructions.push(program.instruction.whitelistCommit(new anchor.BN(amount*LAMPORTS_PER_SOL),{
            accounts:{
                owner: address,
                pool: InfoPresale.pool,
                userData: userAccount,
                solFrom: newAccount.publicKey,
                solTo: InfoPresale.solAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        instructions.push(createCloseAccountInstruction(newAccount.publicKey, address, address))
        await sendTransactionWithRetry(conn, wallet, instructions, [newAccount])
    }, [publicKey, conn, program, wallet])

    const commit = useCallback(async(amount : number) => {
        let address = publicKey!
        let [userAccount,bump] = PublicKey.findProgramAddressSync([address.toBuffer(), InfoPresale.pool.toBuffer()], InfoPresale.programId)
        let instructions: TransactionInstruction[] = []
        if((await conn.getAccountInfo(userAccount)) == null){
            instructions.push(program.instruction.initUserData(address, new anchor.BN(bump),{
                accounts:{
                    payer: address,
                    pool: InfoPresale.pool,
                    userData: userAccount,
                    systemProgram: SystemProgram.programId
                }
            }))
        }
        const accountRentExempt = await conn.getMinimumBalanceForRentExemption(AccountLayout.span)
        const newAccount = Keypair.generate()
        instructions.push(SystemProgram.createAccount({
            fromPubkey: address,
            newAccountPubkey: newAccount.publicKey,
            lamports: amount*LAMPORTS_PER_SOL+accountRentExempt*3,
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
        }))
        instructions.push(createInitializeAccountInstruction(newAccount.publicKey, NATIVE_MINT, address))
        instructions.push(program.instruction.commit(new anchor.BN(amount*LAMPORTS_PER_SOL),{
            accounts:{
                owner: address,
                pool: InfoPresale.pool,
                userData: userAccount,
                solFrom: newAccount.publicKey,
                solTo: InfoPresale.solAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        instructions.push(createCloseAccountInstruction(newAccount.publicKey, address, address))
        await sendTransactionWithRetry(conn, wallet, instructions, [newAccount])
    }, [publicKey, conn, program, wallet])

    const claimToken = useCallback(async() => {
        let address = publicKey!
        let [userAccount,] = PublicKey.findProgramAddressSync([address.toBuffer(), InfoPresale.pool.toBuffer()], InfoPresale.programId)
        let instructions: TransactionInstruction[] = []
        let tokenTo = getAssociatedTokenAddressSync(InfoPresale.tokenMint, address, true, TOKEN_2022_PROGRAM_ID)
        if((await conn.getAccountInfo(tokenTo))==null){
            instructions.push(createAssociatedTokenAccountInstruction(address, tokenTo, address, InfoPresale.tokenMint, TOKEN_2022_PROGRAM_ID))
        }
        instructions.push(program.instruction.claimToken({
            accounts:{
                owner: address,
                pool: InfoPresale.pool,
                userData: userAccount,
                tokenMint: InfoPresale.tokenMint,
                tokenFrom: InfoPresale.tokenAccount,
                tokenTo: tokenTo,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))        
        await sendTransactionWithRetry(conn, wallet, instructions, [])
    }, [wallet, conn, program, publicKey])

    const withdrawSol = useCallback(async() => {
        let address = publicKey!
        let [userAccount,] = PublicKey.findProgramAddressSync([address.toBuffer(), InfoPresale.pool.toBuffer()], InfoPresale.programId)
        let instructions: TransactionInstruction[] = []
        const accountRentExempt = await conn.getMinimumBalanceForRentExemption(AccountLayout.span)
        const newAccount = Keypair.generate()
        instructions.push(SystemProgram.createAccount({
            fromPubkey: address,
            newAccountPubkey: newAccount.publicKey,
            lamports: accountRentExempt*3,
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
        }))
        instructions.push(createInitializeAccountInstruction(newAccount.publicKey, NATIVE_MINT, address))
        instructions.push(program.instruction.withdrawSol({
            accounts:{
                owner: address,
                pool: InfoPresale.pool,
                userData: userAccount,
                solFrom: InfoPresale.solAccount,
                solTo: newAccount.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                clock: SYSVAR_CLOCK_PUBKEY
            }
        }))
        instructions.push(createCloseAccountInstruction(newAccount.publicKey, address, address))
        await sendTransactionWithRetry(conn, wallet, instructions, [newAccount])
    }, [wallet, conn, program, publicKey])

    return <ProgramContext.Provider value={{
        getPresalePoolData,
        getUserData,

        whitelistCommit,
        commit,
        claimToken,
        withdrawSol,
    }}>{children}</ProgramContext.Provider>
}