import React, { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { CFormInput, CForm } from '@coreui/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
    const { forgotPassword } = useAuth()

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
            <AuthLayout />
            <section className="login_center_box">
                <div className="wid450">
                    <h1>Forgot Password</h1>
                    <div className="bg_white_box">
                        <div className="input_form_box">
                            <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                                <div className="form-floating">
                                    <CFormInput
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        feedbackInvalid={"Email is required."}
                                        className={'form-control is_not_validated'}
                                        id="floatingEmail"
                                        placeholder="name@example.com"
                                    />
                                    <label htmlFor="floatingPassword">Email</label>
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

export default ForgotPassword
