import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { CFormInput, CForm } from '@coreui/react';
import { useGoogleLogin } from "@react-oauth/google";
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const { auth, login, toast, loginUserByGoogle } = useAuth();
    const { instance } = useMsal();
    const location = useLocation()

    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    })
    const [validated, setValidated] = useState(false);

    const navigate = useNavigate()

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

    const handleGoogleSignInSuccess = async (res) => {
        try {
            const { access_token } = res;
            const { data } = await axios.get(process.env.REACT_APP_OAUTH2_GOOGLE_API,
                {
                    headers:
                    {
                        Authorization: `Bearer ${access_token}`
                    }
                })

            if (typeof data !== 'undefined') {
                if (data.email_verified) {
                    const { email } = data

                    const googleLogin = await loginUserByGoogle(email)
                    if (!googleLogin?.error) {
                        navigate("/")
                    }
                } else {
                    toast.current?.show({ severity: 'error', summary: 'Login', detail: 'An error occurred. Please try again later.', life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Login', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    };

    const googleSignIn = useGoogleLogin({
        onSuccess: handleGoogleSignInSuccess,
    });

    const handleMicrosoftSignIn = async () => {
        try {
            const loginResponse = await instance.loginPopup({
                scopes: ['user.read'],
                prompt: 'select_account'
            });

            const accessToken = loginResponse.accessToken;
            const { data } = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const { userPrincipalName } = data;
            const email = userPrincipalName.replace('_', '@').split('#')[0];

            const microsoftLogin = await loginUserByGoogle(email); // Assuming you have a loginUserByMicrosoft function
            if (!microsoftLogin?.error) {
                navigate('/');
            }
        } catch (error) {
            console.error('Error during Microsoft login:', error);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            location.pathname !== '/' ? navigate(location.pathname) : (auth.user.role === "user" && navigate('/user/clients'));
        }
    }, [auth?.token, navigate]);


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
                                    <div onClick={() => googleSignIn()} className="brd_green_box">
                                        <img src="/images/google_icn.svg" alt="" />
                                        <span>Sign in with Google</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div onClick={handleMicrosoftSignIn} className="brd_green_box">
                                        <img src="/images/microsoft_icn.svg" alt="" />
                                        <span>Sign in with Microsoft</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="brd_green_box">
                                        <img src="/images/apple_icn.svg" alt="" />
                                        <span>Sign in with Apple</span>
                                    </div>
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
                                                feedbackInvalid={"Email is required."}
                                                className={'form-control is_not_validated'}
                                                id="floatingEmail"
                                                placeholder="name@example.com"
                                            />
                                            <label htmlFor="floatingEmail">Email</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <CFormInput
                                                value={credentials.password}
                                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                                type="password"
                                                required
                                                feedbackInvalid={"Password is required."}
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
                                    <div className="col-md-6 mb-20 forgot_psw_container">
                                        <Link to='forgot-password' className="forgot_psw">Forgot password?</Link>
                                    </div>
                                </div>
                                <button type="submit" className="common_btn d-flex m-auto">Login</button>
                            </CForm>
                            <div className="sign-up">
                                <span>Don’t have an account?</span>
                                <Link to='/register' >Sign up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Login
