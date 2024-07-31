import { useState, useEffect, useContext, createContext, useRef } from "react";
import { baseURL } from "../lib";
import axios from 'axios';

const AuthContext = createContext()

const AuthProvider = ({ children }) => {

    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [auth, setAuth] = useState({
        user: null,
        token: ""
    })

    const toast = useRef(null);

    const logout = () => {
        try {
            const data = localStorage.getItem('auth')
            if (data) {
                localStorage.removeItem("auth")
                setAuth({
                    user: null,
                    token: ""
                })
                setIsLoggedIn(false)
            }
        } catch (error) {
            console.log(error);
        }
    };

    axios.defaults.headers.common["Authorization"] = auth?.token

    const signUp = async (userDetails) => {
        try {
            const { data } = await axios.post(`${baseURL}/user/register`, userDetails);
            if (data.error === false) {
                setIsLoggedIn(true)
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: data.user.first_name, detail: data.message, life: 3000 })
                }, 500);
                setAuth({
                    ...auth,
                    user: data.user,
                    token: data.token
                })
                localStorage.setItem('auth', JSON.stringify(data))
                return data
            } else {
                toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: "Please fill all fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const login = async (credential) => {
        try {
            const { data } = await axios.post(`${baseURL}/user/login`, credential);

            if (data.error === false) {
                setIsLoggedIn(true)
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: data.user.first_name, detail: data.message, life: 3000 })
                }, 500);
                setAuth({
                    ...auth,
                    user: data?.user,
                    token: data?.token
                })

                localStorage.setItem('auth', JSON.stringify(data))
            } else {
                toast.current?.show({ severity: 'error', summary: 'Login', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Login', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Login', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Login', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    };

    const loginUserByGoogle = async (email) => {
        try {
            const { data } = await axios.post(`${baseURL}/user/login-by-google`, { email });

            if (data.error === false) {
                setIsLoggedIn(true)
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: data.user.name, detail: data.message, life: 3000 })
                }, 500);
                setAuth({
                    ...auth,
                    user: data.user,
                    token: data.token
                })
                localStorage.setItem('auth', JSON.stringify(data))
            } else {
                toast.current?.show({ severity: 'error', summary: 'Login', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Login', detail: "Please fill all fields.", life: 3000 })
                } else {
                    const errorMessage = error.response.data.message;
                    toast.current?.show({ severity: 'error', summary: 'Login', detail: errorMessage, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Login', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    };

    const signUpUserByGoogle = async (given_name, family_name, email) => {
        try {
            const { data } = await axios.post(`${baseURL}/user/signup-by-google`, { first_name: given_name, last_name: family_name, email });

            if (data.error === false) {
                setIsLoggedIn(true)
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: data.user.first_name, detail: data.message, life: 3000 })
                }, 500);
                setAuth({
                    ...auth,
                    user: data.user,
                    token: data.token
                })
                localStorage.setItem('auth', JSON.stringify(data))
            } else {
                toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: "Please fill all fields.", life: 3000 })
                } else {
                    const errorMessage = error.response.data.message;
                    toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: errorMessage, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Sign Up', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const resetPassword = async (token, password) => {
        try {
            const { data } = await axios.put(`${baseURL}/user/verify-user/${token}`, { password });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Reset Password', detail: data.message, life: 3000 })
                }, 500);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Reset Password', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Reset Password', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Reset Password', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Reset Password', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const forgotPassword = async (email) => {
        try {
            const { data } = await axios.put(`${baseURL}/user/forgot-password`, { email });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Forgot Password', detail: data.message, life: 3000 })
                }, 500);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Forgot Password', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Forgot Password', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Forgot Password', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Forgot Password', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    useEffect(() => {
        const data = localStorage.getItem('auth')
        if (data) {
            const parseData = JSON.parse(data)
            setAuth({
                ...auth,
                user: parseData?.user,
                token: parseData?.token
            })
        }

    }, [])

    return (
        <AuthContext.Provider value={{ auth, signUp, login, logout, isLoggedIn, toast, loginUserByGoogle, signUpUserByGoogle, resetPassword, forgotPassword }}>
            {children}
        </AuthContext.Provider>
    )
}

const useAuth = () => useContext(AuthContext)

export { useAuth, AuthProvider }