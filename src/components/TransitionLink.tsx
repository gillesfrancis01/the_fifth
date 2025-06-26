"use client"
import { usePathname, useRouter } from "next/navigation"
import { animatePageOut } from "@/utils/animate"

interface Props{
    href: string,
    label:string,
    isActive: boolean
}

const TransitionLink = ({href,label,isActive}: Props) => {
    const router = useRouter()
    const pathname = usePathname()

    const handleClick = () => {
        if(pathname!== href) {
            animatePageOut(href,router)
        }
    }
    return(
        <button className={`text-2xl font-Josefin font-light uppercase hover:text-yellow-400 transition-colors duration-200 ${
            isActive ? 'text-main font-bold' : 'hover:text-main'
          }`} onClick={handleClick}>
            {label}
        </button>
    )
}
export default TransitionLink