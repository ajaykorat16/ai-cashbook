import React, { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { CFormInput, CForm } from '@coreui/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from 'primereact/toast';

const ForgotPassword = () => {
    const { forgotPassword, toast } = useAuth()

    const [validated, setValidated] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = e.currentTarget;
        setValidated(true);

        if (form.checkValidity() === false) {
            e.stopPropagation();
            const firstInvalidInput = form.querySelector(':invalid');
            if (firstInvalidInput) {
                firstInvalidInput.focus();
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            try {
                await forgotPassword(email)
            } catch (error) {
                console.log(error);
            }
        }
    }

    return (
        <>
            <Toast ref={toast} />
            <div className='login_page'>
                <section className="main_header login_header">
                    <header>
                        <div className="container">
                            <div className="main_logo">
                                <img className='web_logo' src="/images/accoutn_logo.svg" alt="" />
                            </div>
                        </div>
                    </header>
                </section>
                <div className='container d-flex col login_container'>
                    <div className='first_container'>
                        <img className='img-responsive login_img' src="/images/login.png" alt="" />
                    </div>
                    <div className='second_container'>
                        <div className='singnin_text text-center reset_pass_text'>
                            Forgot Password
                        </div>
                        <div className='container_body'>
                            <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                                <div className="row credentials_container">
                                    <label htmlFor="floatingEmail" className='pb-2 credential_label'>Email</label>
                                    <CFormInput
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        feedbackInvalid={"Email is required."}
                                        className={'form-control is_not_validated credential_input'}
                                        id="floatingEmail"
                                    />
                                </div>
                                <button type="submit" className="lined_btn d-flex mx-auto login_btn">Submit</button>
                            </CForm>
                            <div className="sign-up">
                                <Link to='/' className='green_label'>Back to Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ForgotPassword
