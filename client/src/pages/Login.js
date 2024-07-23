import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext';
import { Toast } from 'primereact/toast';
import { CFormInput, CForm } from '@coreui/react';


const Login = () => {
    const { auth, login, toast } = useAuth();

    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    })
    const [validated, setValidated] = useState(false);


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
                await login(credentials);
            } catch (error) {
                console.log(error);
            }
        }
    };


    // useEffect(() => {
    //     if (auth?.token) {
    //         location.pathname !== '/' ? navigate(location.pathname) : (auth.user.role === "admin" && navigate('/admin/user/list'));
    //     }
    // }, [auth?.token, navigate]);


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
            <section className="login_center_box">
                <div className="wid700">
                    <h1>Login</h1>
                    <div className="bg_white_box">
                        <div className="special_login_box">
                            <div className="row justify-content-center">
                                <div className="col-md-6">
                                    <a href="#" className="brd_green_box">
                                        <img src="/images/google_icn.svg" alt="" />
                                        <span>Sign in with Google</span>
                                    </a>
                                </div>
                                <div className="col-md-6">
                                    <a href="#" className="brd_green_box">
                                        <img src="/images/microsoft_icn.svg" alt="" />
                                        <span>Sign in with Microsoft</span>
                                    </a>
                                </div>
                                <div className="col-md-6">
                                    <a href="#" className="brd_green_box">
                                        <img src="/images/apple_icn.svg" alt="" />
                                        <span>Sign in with Apple</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="brd_or_center">
                            <div className="or_center">OR</div>
                        </div>
                        <div className="input_form_box">
                            <CForm onSubmit={handleSubmit} noValidate validated={validated}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                type="email"
                                                value={credentials.email}
                                                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                                required
                                                feedbackInvalid={"Plz enter email"}
                                                className={'form-control is_not_validated'}
                                                id="floatingInput"
                                                placeholder="name@example.com"
                                            />
                                            <label htmlFor="floatingInput">Email</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                value={credentials.password}
                                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                                type="password"
                                                required
                                                feedbackInvalid={"Plz enter password"}
                                                className={'form-control eye_icn is_not_validated'}
                                                id="floatingPassword"
                                                placeholder="Password"
                                            />
                                            <label htmlFor="floatingPassword">Password</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="check_box mb-20">
                                            <input className="styled-checkbox" id="styled-checkbox-2" type="checkbox" value="value2" />
                                            <label htmlFor="styled-checkbox-2">Keep Me Signed In</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-20">
                                        <a href="#" className="forgot_psw">Forgot password?</a>
                                    </div>
                                </div>
                                <button type="submit" className="common_btn d-flex m-auto">Create Account</button>
                            </CForm>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Login
