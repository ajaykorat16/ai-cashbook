import React, { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { CFormInput, CForm } from '@coreui/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '@iconify/react';

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
            <AuthLayout />
            <section className="login_center_box">
                <div className="wid450">
                    <h1>Reset Password</h1>
                    <div className="bg_white_box">
                        <div className="input_form_box">
                            <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                                <div className="password-container">
                                    <div className="form-floating">
                                        <CFormInput
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            type={passwordVisible ? 'text' : 'password'}
                                            minLength="8"
                                            required
                                            feedbackInvalid={"Password must be at least 8 characters long."}
                                            className={'form-control is_not_validated'}
                                            id="floatingPassword"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setPasswordVisible(!passwordVisible)}
                                        >
                                            <Icon icon={passwordVisible ? 'ph:eye-slash' : 'ph:eye'} width={30} height={30} />
                                        </button>
                                        <label htmlFor="floatingPassword">Password</label>
                                    </div>
                                </div>
                                <div className="password-container">
                                    <div className="form-floating">
                                        <CFormInput
                                            value={credentials.confirm_password}
                                            minLength="8"
                                            onChange={(e) => setCredentials({ ...credentials, confirm_password: e.target.value })}
                                            type={confirmPassVisible ? 'text' : 'password'}
                                            required
                                            feedbackInvalid={"Confirm password must be at least 8 characters long."}
                                            className='form-control is_not_validated'
                                            id="floatingConfirmPassword"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setConfirmPassVisible(!confirmPassVisible)}
                                        >
                                            <Icon icon={confirmPassVisible ? 'ph:eye-slash' : 'ph:eye'} width={30} height={30} />
                                        </button>
                                        <label htmlFor="floatingConfirmPassword">Confirm Password</label>
                                    </div>
                                </div>
                                <button type="submit" className="common_btn d-flex m-auto">Submit</button>
                            </CForm>
                            <div className="sign-up">
                                <Link to='/'>Back to Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ResetPassword
