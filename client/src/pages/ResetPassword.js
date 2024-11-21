import React, { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { CFormInput, CForm } from '@coreui/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '@iconify/react';
import { Toast } from 'primereact/toast';

const ResetPassword = () => {
    const navigate = useNavigate()
    const params = useParams();
    const { toast, resetPassword } = useAuth()

    const [validated, setValidated] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPassVisible, setConfirmPassVisible] = useState(false);
    const [credentials, setCredentials] = useState({
        password: "",
        confirm_password: ""
    })

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
                const { password, confirm_password } = credentials
                if (password !== confirm_password) {
                    toast.current?.show({ severity: 'error', summary: 'Client', detail: "Password do not match.", life: 3000 })
                } else {
                    const data = await resetPassword(params?.token, password)
                    if (!data.error) {
                        navigate("/")
                    }
                }
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
                            Reset Password
                        </div>
                        <div className='container_body'>
                            <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                                <div className='row credentials_container'>
                                    <div className="position-relative reset_pass_input">
                                        <label htmlFor="floatingPassword" className='pb-2 credential_label'>Password</label>
                                        <CFormInput
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            type={passwordVisible ? 'text' : 'password'}
                                            minLength="8"
                                            required
                                            feedbackInvalid={"Password must be at least 8 characters long."}
                                            className={'form-control is_not_validated credential_input'}
                                            id="floatingPassword"
                                        />
                                        <button
                                            type="button"
                                            className="password-visiblity"
                                            onClick={() => setPasswordVisible(!passwordVisible)}
                                        >
                                            <Icon icon={passwordVisible ? 'ph:eye-slash' : 'ph:eye'} width={30} height={30} />
                                        </button>
                                    </div>
                                    <div className="position-relative reset_pass_input">
                                        <label htmlFor="floatingConfirmPassword" className='pb-2 credential_label'>Confirm Password</label>
                                        <CFormInput
                                            value={credentials.confirm_password}
                                            minLength="8"
                                            onChange={(e) => setCredentials({ ...credentials, confirm_password: e.target.value })}
                                            type={confirmPassVisible ? 'text' : 'password'}
                                            required
                                            feedbackInvalid={"Confirm password must be at least 8 characters long."}
                                            className='form-control is_not_validated credential_input'
                                            id="floatingConfirmPassword"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            className="password-visiblity"
                                            onClick={() => setConfirmPassVisible(!confirmPassVisible)}
                                        >
                                            <Icon icon={confirmPassVisible ? 'ph:eye-slash' : 'ph:eye'} width={30} height={30} />
                                        </button>
                                    </div>
                                    <button type="submit" className="lined_btn d-flex mx-auto login_btn">Submit</button>
                                </div>
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

export default ResetPassword
