import { createContext, useContext } from "react";
import { PublicKey } from '@solana/web3.js';

export interface ProgramContextState{
    getPresalePoolData() : Promise<any>;
    getUserData(address : PublicKey) : Promise<any>

    whitelistCommit(amount: number) : void;
    commit(amount: number) : void;
    claimToken() : void;
    withdrawSol() : void;
}

export const ProgramContext = createContext<ProgramContextState>({
} as ProgramContextState)

export function useProgram() : ProgramContextState{
    return useContext(ProgramContext)
}