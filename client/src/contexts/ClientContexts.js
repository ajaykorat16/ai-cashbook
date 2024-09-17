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

    const getLastClientCode = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/lastclient-code`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getAllClients = async (currentPage, rowsPerPage, sortField, sortOrder, filter) => {
        try {
            const { data } = await axios.get(`${baseURL}/client?&sortField=${sortField}&sortOrder=${sortOrder}&page=${currentPage}&limit=${rowsPerPage}&filter=${filter !== '' ? filter : null}`, { headers })
            if (data.error === false) {
                return data
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const clientsWithoutPagination = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/client/clients-without-pagination`, { headers })
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
            const { data } = await axios.delete(`${baseURL}/client/delete/${id}`, { headers });
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
            let { data } = await axios.get(`${baseURL}/client/category/${id}`, { headers })
            if (data.error === false) {
                return data?.clientCategory
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Client Category', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const getSpreadsheet = async (id) => {
        try {
            let { data } = await axios.get(`${baseURL}/client/spreasheet/${id}`, { headers })
            if (data.error === false) {
                return data?.spreadsheet
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
        }
    }

    const updateClientCatrgory = async (id, csvData) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update-category/${id}`, { data: csvData }, { headers });
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

    const createSpreadsheet = async (id, csvData) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/create-spreasheet/${id}`, { data: csvData }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
                return data;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const updateSpreadsheet = async (id, csvData) => {
        try {
            const { data } = await axios.put(`${baseURL}/client/update-spreasheet/${id}`, { data: csvData }, { headers });
            if (data.error === false) {
                return data;
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: data.message, life: 3000 })
            }
        } catch (error) {
            if (error.response) {
                const errors = error.response.data.errors;
                if (errors && Array.isArray(errors) && errors.length > 0) {
                    toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: errors[0].msg, life: 3000 })
                }
            } else {
                toast.current?.show({ severity: 'error', summary: 'Spreadsheet', detail: 'An error occurred. Please try again later.', life: 3000 })
            }
        }
    }

    const importClient = async (clients, isInsert) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/import`, { clients, isInsert }, { headers });
            if (data.error === false && isInsert) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
            } else if (isInsert) {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {

        }
    }

    const multipleDeleteClient = async (selectedClientIds) => {
        try {
            const { data } = await axios.post(`${baseURL}/client/bulk-delete`, { selectedClientIds }, { headers });
            if (data.error === false) {
                setTimeout(function () {
                    toast.current?.show({ severity: 'success', summary: 'Client', detail: data.message, life: 3000 })
                }, 500);
            } else {
                toast.current?.show({ severity: 'error', summary: 'Client', detail: data.message, life: 3000 })
            }
            return data
        } catch (error) {

        }
    }

    return (
        <ClientContext.Provider value={{
            createClient, getSingleClient, getAllClients, clientsWithoutPagination, updateClient, getSpreadsheet, updateSpreadsheet, createSpreadsheet,
            deleteClient, getClientCategory, updateClientCatrgory, clientObject, setClientObject, importClient, multipleDeleteClient, getLastClientCode
        }}>
            {children}
        </ClientContext.Provider>
    )
}

const useClient = () => useContext(ClientContext)
export { useClient, ClientProvider }