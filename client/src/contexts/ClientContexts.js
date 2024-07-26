import { useContext, createContext } from "react";
import { baseURL } from "../lib";
import axios from 'axios'
import { useAuth } from "./AuthContext";

const ClientContext = createContext()

const ClientProvider = ({ children }) => {
    const { auth, toast } = useAuth()

    const headers = {
        Authorization: auth?.token,
    };

    const getClientCategory = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/client-category/${id}`, { headers })
            if (data.error === false) {
                console.log("data?.clientCatgory---", data?.clientCategory)
                return data?.clientCategory
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Course', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const updateClientCatrgory = async (id, csvData) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update-client-category/${id}`, { data: csvData }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client Category', detail: data.message, life: 3000 })
                }, 500);
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
        <ClientContext.Provider value={{ getClientCategory, updateClientCatrgory }}>
            {children}
        </ClientContext.Provider>
    )
}

const useClient = () => useContext(ClientContext)

export { useClient, ClientProvider }