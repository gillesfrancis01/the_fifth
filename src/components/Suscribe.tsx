'use client'
import addCustomer from '@/app/actions/addCustomer'
import React, { useEffect } from 'react'
import { useActionState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { useLanguage } from '@/context/LanguageContext'
const Suscribe = () => {
  const [state, formAction] = useActionState(addCustomer,{});
  const { t } = useLanguage()
  useEffect(() => {
    if(state.error) toast.error(state.error);
    if (state.success) {
            toast.success('Subscribed succeessfully')
        }
}, [state])
return (
<div>
   <h3 className='text-xl  font-Josefin text-main font-bold pt-5 mb-5'>
   {t('subscribeTitle')}</h3>
   <form action={formAction} className='bg-[#262626] max-md:w-[90vw] m-auto p-2 border-1 border-[#404040] rounded-sm flex flex-wrap mb-5'>
   <input type="email" id='email' name='email' required placeholder={t('subscribePlaceholder')} className='w-[70%]'/>
   <button type='submit' className='bg-main p-4 text-black rounded-xl '>{t('subscribeButton')}</button>
   <label className='basis-full flex items-start gap-2 mt-3 text-xs text-white/70 cursor-pointer'>
     <input type='checkbox' name='consent' required className='mt-0.5 h-4 w-4 shrink-0 accent-[#E6C55D]' />
     <span>{t('newsletterConsent')}</span>
   </label>
   <ToastContainer />
   </form>
   </div>
   )
  }
  
  export default Suscribe
