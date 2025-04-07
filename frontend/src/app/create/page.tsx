import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className='flex flex-col items-center justify-center h-screen'>
        <div className='flex flex-col items-center justify-center border-2 border-gray-300 rounded-lg p-4 w-1/2 h-1/2'>
      <h1 className='text-4xl font-bold text-center mb-4 '>Create</h1>
      <div className='flex flex-row items-center justify-center gap-4'>
        <Link href="/create/surprise-me" className='bg-amber-600 text-white px-4 py-2 rounded-lg'>
        <button className='border-2 border-amber-600 rounded-lg'>Surprise Me</button>
        </Link>
        <Link href="/create/assist-me" className='bg-amber-600 text-white px-4 py-2 rounded-lg'>
        <button className='border-2 border-amber-600 rounded-lg'>Assist Me</button>
        </Link>
       
        </div>
      </div>
    </div>
  )
}

export default page
