import React from 'react'
import { Toast } from 'primereact/toast';
import { useAuth } from '../contexts/AuthContext';

const ThanksPage = () => {
    const { toast } = useAuth();
    return (
        <>
            <Toast ref={toast} />
            <section className="main_header login_header">
                <header>
                    <div className="container">
                        <div className="main_logo">
                            <a href="#"><img src="/images/accoutn_logo.svg" alt="" /></a>
                        </div>
                    </div>
                </header>
            </section>
            <section className='login_center_box'>
                <div className="wid700">
                    <span className='thanksMessage'>
                        Thank you for signing up, Please confirm your email and generate password.
                    </span>
                </div>
            </section>
        </>
    )
}

export default ThanksPage