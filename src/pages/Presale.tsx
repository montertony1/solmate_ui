import { FC, useEffect, useState } from 'react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import CustomParticles from '../components/CustomParticles';
import { useProgram } from "../utils/presale/useProgram"
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { InfoPresale } from '../utils/presale/constants';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {notification} from 'antd'

export const getCurrentTime = (date : Date) => {
    let month = (date.getMonth()+1) >= 10 ? (date.getMonth()+1) :"0"+(date.getMonth()+1)
    let day = date.getDate() >= 10 ? date.getDate() : "0"+date.getDate()
    let hours = date.getHours() >= 10 ? date.getHours() : "0"+date.getHours()
    let minutes = date.getMinutes() >= 10 ? date.getMinutes() : "0"+date.getMinutes()
    return date.getFullYear()+"-"+month+"-"+day+"  "+hours+":"+minutes
}

export const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
    notification[type]({
        message : title, description : description, placement : 'topLeft'
    })
}

const Presale: FC = () => {
    const {getPresalePoolData, getUserData, whitelistCommit, commit, claimToken, withdrawSol} = useProgram()

    const {publicKey} = useWallet()
    const [poolData, setPoolData] = useState<any>(null)
    const [userData, setUserData] = useState<any>(null)
    const [currentTime, setCurrentTime] = useState(new Date().getTime())
    const [whitelistAmount, setWhitelistAmount] = useState('')
    const [amount, setAmount] = useState('')

    useEffect(()=>{
        const interval = setInterval(()=>{setCurrentTime(new Date().getTime())}, 1000)
        return ()=>clearInterval(interval)
    },[])

    useEffect(()=>{
        getPoolData()
    },[])
    useEffect(()=>{
        const interval = setInterval(()=>{getPoolData()}, 10000)
        return ()=>clearInterval(interval)
    },[])
    const getPoolData = async() => {
        setPoolData(await getPresalePoolData())
    }

    useEffect(()=>{
        getUserAccountData()
    },[publicKey])
    useEffect(()=>{
        const interval = setInterval(()=>{getUserAccountData()}, 10000)
        return ()=>clearInterval(interval)
    },[publicKey])
    const getUserAccountData = async()=>{
        if(publicKey!=null){
            setUserData(await getUserData(publicKey!))
        }else{
            setUserData(null)
        }
    }

    return (
        <>
            <div className='presale relative min-h-screen flex flex-col break-words'>
                <CustomParticles />
                <Header />

                <div className="container mx-auto my-12">
                    <div className="relative px-8">
                        <div className="flex flex-col gap-8 text-center items-center lg:mb-48 md:mb-36 mb-24">
                            <h1 className="text-4xl text-secondary tracking-[.4em] leading-12 mb-4 font-body">
                                GET IN EARLY ON <br />
                                THE <b>SOLMATE PRESALE</b>
                            </h1>

                            <p className="text-2xl text-primary max-w-[600px]">
                                Community run and supported project Runs on
                                Solana Network Fast, Secure, low cost
                                transaction fees DeFi and community driven
                            </p>
                            {
                                poolData!=null ?
                                    <>
                                        <div className='text-primary text-xl'>
                                            <p className='text-left'>Hard Cap : {poolData.hardCap / LAMPORTS_PER_SOL} SOL</p>
                                            <p className='text-left mt-2'>Soft Cap : {poolData.softCap / LAMPORTS_PER_SOL}</p>
                                            <p className='text-left mt-2'>Collected Amount : {(poolData.commitAmount + poolData.whitelistCommitAmount)/LAMPORTS_PER_SOL} SOL</p>
                                            <p className='text-left mt-2'>Private Sale Price : {"1 SOL = "+(poolData.whitelistPriceDenominator/poolData.whitelistPriceNumerator)+" SMT"}</p>
                                            <p className='text-left mt-2'>Private Sale Time : {getCurrentTime(new Date(poolData.whitelistStartTime)) + "  ~  " + getCurrentTime(new Date(poolData.whitelistEndTime))}</p>
                                            <p className='text-left mt-2'>Private Sale Commit : {poolData.whitelistMinCommit/LAMPORTS_PER_SOL+" SOL  ~   "+(poolData.whitelistMaxCommit!==0 ? (poolData.whitelistMaxCommit/LAMPORTS_PER_SOL + " SOL") : "No Limit")}</p>
                                            <p className='text-left mt-2'>Public Sale Price : {"1 SOL = "+(poolData.priceDenominator/poolData.priceNumerator)+" SMT"}</p>
                                            <p className='text-left mt-2'>Public Sale Time : {getCurrentTime(new Date(poolData.startTime)) + "  ~  " + getCurrentTime(new Date(poolData.endTime))}</p>
                                            <p className='text-left mt-2'>Public Sale Commit : {poolData.minCommit/LAMPORTS_PER_SOL + " SOL  ~  "+(poolData.maxCommit!==0? poolData.maxCommit/LAMPORTS_PER_SOL + " SOL" : "No Limit")}</p>
                                            <hr className='mt-2'/>
                                            {
                                                userData!=null &&
                                                <>
                                                    <p className='text-left mt-2'>Your Amount in Private Sale : {userData.whitelistCommitAmount / LAMPORTS_PER_SOL} SOL</p>
                                                    <p className='text-left mt-2'>Your Amount in Public Sale : {userData.commitAmount / LAMPORTS_PER_SOL} SOL</p>
                                                </>
                                            }
                                        </div>
                                        {
                                            publicKey==null ?
                                                <><WalletMultiButton>Connect Wallet</WalletMultiButton></>
                                            :
                                            currentTime > poolData.whitelistStartTime && currentTime<poolData.whitelistEndTime ?
                                                userData!=null && userData.isWhitelist ?
                                                    <>
                                                        <input type="text" style={{color: "white", fontWeight: 400, outline: "none", border: "1px solid rgb(44,47,54)", backgroundColor: "rgb(33,36,41)", fontSize: "20px", padding: "12px 20px", borderRadius: "0.8rem", textAlign: "center"}} onChange={(e)=>{setWhitelistAmount(e.target.value)}} value={whitelistAmount}/>
                                                        <button type='button' className='text-xl text-black font-semibold bg-secondary py-3 px-6 rounded-lg cursor-pointer hover:opacity-80' onClick={async()=>{
                                                            try{
                                                                await whitelistCommit(Number(whitelistAmount))
                                                                openNotification('success', 'Buy Success!')
                                                            }catch(err: any){
                                                                openNotification('error', err.message)
                                                            }
                                                        }}>Buy SolMate Token</button>
                                                    </>
                                                :
                                                    <p style={{color: "#eeeb39", fontSize: "24px"}}>You are not whitelisted</p>
                                            :
                                            currentTime > poolData.startTime && currentTime < poolData.endTime ?
                                                <>
                                                    <p style={{color: "#eeeb39", fontSize: "24px"}}>Public Sale</p>
                                                    <input type="text" style={{color: "white", fontWeight: 400, outline: "none", border: "1px solid rgb(44,47,54)", backgroundColor: "rgb(33,36,41)", fontSize: "20px", padding: "12px 20px", borderRadius: "0.8rem", textAlign: "center"}} onChange={(e)=>{setAmount(e.target.value)}} value={amount}/>
                                                    <button type='button' className='text-xl text-black font-semibold bg-secondary py-3 px-6 rounded-lg cursor-pointer hover:opacity-80' onClick={async()=>{
                                                        try{
                                                            await commit(Number(amount))
                                                            openNotification('success', 'Buy Success!')
                                                        }catch(err: any){
                                                            openNotification('error', err.message)
                                                        }
                                                    }}>Buy SolMate Token</button>
                                                </>
                                            :
                                            currentTime > poolData.endTime ? 
                                                <>
                                                {
                                                    (poolData.whitelistCommitAmount + poolData.commitAmount) >= poolData.softCap ?
                                                        <>
                                                            <p style={{color: "#2cf32c", fontSize: "30px"}}>Presale Success</p>
                                                            {
                                                                userData==null ?
                                                                    <></>
                                                                :
                                                                userData.done ?
                                                                    <p style={{color: "#eeeb39", fontSize: "24px"}}>You claimed SMT</p>
                                                                :
                                                                    <button type='button' className='text-xl text-black font-semibold bg-secondary py-3 px-6 rounded-lg cursor-pointer hover:opacity-80' onClick={async()=>{
                                                                        try{
                                                                            await claimToken()
                                                                            openNotification('success', 'Claim Success!')
                                                                        }catch(err: any){
                                                                            openNotification('error', err.message)
                                                                        }
                                                                    }}>Claim Token</button>
                                                            }
                                                        </>
                                                    :
                                                        <>
                                                            <p style={{color: "#e65c58", fontSize: "30px"}}>Presale Failed</p>
                                                            {
                                                                userData==null ?
                                                                    <></>
                                                                :
                                                                userData.done ?
                                                                    <p style={{color: "#eeeb39", fontSize: "24px"}}>You withdrawn your SOL</p>
                                                                :
                                                                    <button type='button' className='text-xl text-black font-semibold bg-secondary py-3 px-6 rounded-lg cursor-pointer hover:opacity-80' onClick={async()=>{
                                                                        try{
                                                                            await withdrawSol()
                                                                            openNotification('success', 'Withdraw Success!')
                                                                        }catch(err: any){
                                                                            openNotification('error', err.message)
                                                                        }
                                                                    }}>Withdraw Sol</button>
                                                            }
                                                        </>
                                                }
                                                </>
                                            :
                                                <p style={{color: "#eeeb39", fontSize: "24px"}}>IDLE TIME</p>
                                        }
                                    </>
                                
                                :
                                    <div className='text-center text-xl text-primary'>
                                        Loading...
                                    </div>
                            }

                            {/* {
                                price ?
                                    <>

                                        <div className='text-primary text-xl'>

                                            <p className='text-left'>
                                                1 USDT = {price} SOUL
                                            </p>

                                            <p className='text-left mt-2'>
                                                Token Supply : {totalSupply?.toString()} SOUL
                                            </p>

                                            <p className='text-left mt-2'>
                                                Total Saled : {currentSupply?.toString()} SOUL
                                            </p>

                                            <div className='w-full border border-secondary bg-transparent mt-4'>
                                                <div className='bg-secondary h-8' style={{ width: `${(currentSupply ?? 0) / (totalSupply ?? 0) * 100}%` }}>
                                                </div>
                                            </div>

                                        </div>

                                        <button type='button'
                                            className='text-xl text-black font-semibold bg-secondary py-3 px-6 rounded-lg cursor-pointer hover:opacity-80'
                                            onClick={}>
                                            Buy SolMate Token
                                        </button>

                                    </>
                                    : <div className='text-center text-xl text-primary'>
                                        Loading...
                                    </div>
                            } */}

                        </div>

                        <div className="flex flex-col gap-8 text-center items-center lg:mb-48 md:mb-36 mb-24">
                            <h1 className="text-4xl text-secondary tracking-[.4em] mb-4">
                                WHY SOLMATE?
                            </h1>
                            <div className="flex md:flex-row flex-col gap-8 text-left mb-8">
                                <div className="flex-1">
                                    <h2 className="text-secondary text-6xl tracking-[.4em] m-2">
                                        1
                                    </h2>
                                    <h3 className="text-secondary text-2xl tracking-[.4em]">
                                        SOUL
                                    </h3>
                                    <p className="text-lsecondary text-xl">
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipiscing elit. Tempus vulputate eros,
                                        non accumsan venenatis varius. Quis
                                        fringilla euismod dui, tellus rhoncus,
                                        scelerisque.
                                    </p>
                                </div>

                                <div className='flex-1'>
                                    <h2 className='text-secondary text-6xl tracking-[.4em] m-2'>2</h2>
                                    <h3 className='text-secondary text-2xl tracking-[.4em]'>SOUL</h3>
                                    <p className='text-lsecondary text-xl'>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tempus vulputate eros, non accumsan venenatis varius. Quis fringilla euismod dui, tellus rhoncus, scelerisque.
                                    </p>
                                </div>

                                <div className='flex-1'>
                                    <h2 className='text-secondary text-6xl tracking-[.4em] m-2'>3</h2>
                                    <h3 className='text-secondary text-2xl tracking-[.4em]'>SOUL</h3>
                                    <p className='text-lsecondary text-xl'>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tempus vulputate eros, non accumsan venenatis varius. Quis fringilla euismod dui, tellus rhoncus, scelerisque.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-8 text-center items-center lg:mb-48 md:mb-36 mb-24">
                            <h1 className="text-4xl text-secondary tracking-[.4em] mb-4">
                                HOW TO BUY SOLMATE
                            </h1>
                            <div className="flex md:flex-row flex-col gap-8 text-left mb-8">
                                <div className="flex-1">
                                    <div className="w-36 bg-secondary text-black text-2xl text-center font-medium mb-4">
                                        STEP 1
                                    </div>
                                    <p className="text-lsecondary text-xl">
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipiscing elit. Tempus vulputate eros,
                                        non accumsan venenatis varius. Quis
                                        fringilla euismod dui, tellus rhoncus,
                                        scelerisque.
                                    </p>
                                </div>

                                <div className="flex-1">
                                    <div className="w-36 bg-secondary text-black text-2xl text-center font-medium mb-4">
                                        STEP 2
                                    </div>
                                    <p className="text-lsecondary text-xl">
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipiscing elit. Tempus vulputate eros,
                                        non accumsan venenatis varius. Quis
                                        fringilla euismod dui, tellus rhoncus,
                                        scelerisque.
                                    </p>
                                </div>

                                <div className="flex-1">
                                    <div className="w-36 bg-secondary text-black text-2xl text-center font-medium mb-4">
                                        STEP 3
                                    </div>
                                    <p className="text-lsecondary text-xl">
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipiscing elit. Tempus vulputate eros,
                                        non accumsan venenatis varius. Quis
                                        fringilla euismod dui, tellus rhoncus,
                                        scelerisque.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
                <div className='footer-overlay absolute top-0 w-full min-h-screen h-full'></div>
            </div>
        </>
    );
};

export default Presale;
