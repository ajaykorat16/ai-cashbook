import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Toast } from 'primereact/toast'
import { Link } from 'react-router-dom'

const AuthLayout = () => {
    const { toast } = useAuth()

    return (
        <>
            <Toast ref={toast} />
            <section className="main_header login_header">
                <header>
                    <div className="container">
                        <div className="main_logo">
                            <Link to="/"><img src="/images/accoutn_logo.svg" alt="" /></Link>
                        </div>
                    </div>
                </header>
            </section>
        </>
    )
}

export default AuthLayout
