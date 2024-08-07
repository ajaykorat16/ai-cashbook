import { useContext, createContext, useState } from "react";
import { baseURL } from "../lib";
import axios from 'axios'
import { useAuth } from "./AuthContext";

const ClientContext = createContext()

const ClientProvider = ({ children }) => {
    const { auth, toast } = useAuth()
    const [clientObject, setClientObject] = useState("")

    const headers = {
        Authorization: auth?.token,
    };

    const createClient = async (clientDetail) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/create`, clientDetail, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const getSingleClient = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/single-client/${id}`, { headers })
            if (data.error === false) {
                return data.client
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getAllClients = async (currentPage, rowsPerPage, sortField, sortOrder, filter) => {
        try {
            const { data } = await axios.get(`${baseURL}/client/client-list?&sortField=${sortField}&sortOrder=${sortOrder}&page=${currentPage}&limit=${rowsPerPage}&filter=${filter !== '' ? filter : null}`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const updateClient = async (id, clientDetail) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update/${id}`, clientDetail, { headers });
            if (data.error === false) {
                toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    if (errors.length > 1) {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: "Please fill all mandatory fields.", life: 3000 })
                    } else {
                        toast.current?.show({ severity: 'error', summary: 'Client', detail: errors[0].msg, life: 3000 })
                    }
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const deleteClient = async (id) => {
        try {
            const { data } = await axios.delete(`${baseURL}/client/delete-client/${id}`, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
                return data
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
                return data;
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getClientCategory = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/client-category/${id}`, { headers })
            if (data.error === false) {
                return data?.clientCategory
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client Category', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const updateClientCatrgory = async (id, csvData) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update-client-category/${id}`, { data: csvData }, { headers });
            if (data.error === false) {
                return data;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client Category', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Client Category', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client Category', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }


    return (
        <ClientContext.Provider value={{ createClient, getSingleClient, getAllClients, updateClient, deleteClient, getClientCategory, updateClientCatrgory, clientObject, setClientObject }}>
            {children}
        </ClientContext.Provider>
    )
}

const useClient = () => useContext(ClientContext)

export { useClient, ClientProvider }