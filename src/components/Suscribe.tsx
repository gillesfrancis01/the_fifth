'use client'
import addCustomer from '@/app/actions/addCustomer'
import React, { useEffect } from 'react'
import { useActionState } from 'react'
import { toast, ToastContainer } from 'react-toastify'

const Suscribe = () => {
    const [state, formAction] = useActionState(addCustomer,{});

    useEffect(() => {
        if(state.error) toast.error(state.error);
        if (state.success) {
                toast.success('Subscribed succeessfully')
            }
    }, [state])
  return (
    <div>
       <h3 className='text-xl  font-Josefin text-main font-bold pt-5'>
       Subscribe for the Newsletter</h3>
       <form action={formAction} className='bg-[#262626] max-md:w-[90vw] m-auto p-2 border-1 border-[#404040] rounded-sm '>
       <input type="email" id='email' name='email'  placeholder='Your email here'/>
       <button type='submit' className='bg-main p-4 text-black rounded-xl'>Subscribe</button>
       <ToastContainer />
       </form>
       </div>
  )
}

export default Suscribe