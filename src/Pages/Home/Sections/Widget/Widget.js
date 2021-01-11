import React, {useEffect, useState} from 'react'
import {useTranslation} from "react-i18next"
import { Controller, useForm, FormContext } from "react-hook-form"
import ReactSelect from 'react-select'
import countryList from 'react-select-country-list'

import Headline from "../../../../components/Headline/Headline"
import Input from "../../../../components/Input/Input"
import {apiRequestForm, apiConfirmEmail, apiRequestSms, apiConfirmSms} from "../../../../api/api"
import {phoneValidation} from '../../../../utils/validation'

import './Widget.scss'

const Widget = () => {

    const { t } = useTranslation()

    const options = countryList().data
    let CZECH_REPUBLIC = {
        label: '',
        value: ''
    }

    const countries = options.map(c => ({
        label: c.label === 'Virgin Islands, U.S.' ? t('Main.widget.countries.VirginIslands') : t('Main.widget.countries.' + c.label) || '-',
        value: c.value
    }))

    const countriesFiltered = countries.sort((country1, country2) => {
        if (country1.label < country2.label) return -1
        if (country1.label > country2.label) return 1
        return 0
    }).map(country => {
        if (country.value === 'CZ') {
            return CZECH_REPUBLIC = {
                label: country.label,
                value: country.value
            }
        }
        return {
            label: country.label,
            value: country.value
        }
    })

    const defaultValues = {
        name: '',
        surname: '',
        email: '',
        emailCode: '',
        phone: '',
        phoneCode: '',
        country: ''
    }

    const methods = useForm({mode: 'onChange'})
    const { handleSubmit, errors} = methods

    const [country, setCountry] = useState(CZECH_REPUBLIC.value)

    const [nameValue, setNameValue] = useState(null)
    const [surnameValue, setSurnameValue] = useState(null)
    const [emailValue, setEmailValue] = useState(null)
    const [phoneValue, setPhoneValue] = useState(null)

    const [isRequest, setIsRequest] = useState(false)

    const handleSetInputValue = (event) => {
        switch (event.target.name) {
            case 'name': setNameValue(event.target.value)
                break
            case 'surname': setSurnameValue(event.target.value)
                break
            case 'email': setEmailValue(event.target.value)
                break
            case 'phone': setPhoneValue(event.target.value)
                break
            default: return true
        }
    }

    const [emailCode, setEmailCode] = useState(null)
    const [errorMailCode, setErrorMailCode] = useState(null)

    const [phoneCode, setPhoneCode] = useState(null)
    const [errorPhoneCode, setErrorPhoneCode] = useState(null)

    const handleSetCode = (e) => {
        if (e.target.name === 'emailCode') {
            setEmailCode(e.target.value)
            setErrorMailCode(null)
        } else if (e.target.name === 'phoneCode') {
            setPhoneCode(e.target.value)
            setErrorPhoneCode(null)
        }
    }

    const [errorWidget, setErrorWidget] = useState(null)

    useEffect(() => {
        setTimeout(() => {
            setErrorWidget(null)
        }, 10000)
    }, [errorWidget])

    const [isRequestSms, setIsRequestSms] = useState(false)

    const [hash, setHash] = useState(false)

    const [isValidateForm, setIsValidateForm] = useState(false)

    const [phoneIsUsed, setPhoneIsUsed] = useState(false)

    const handleSendValue = async (data) => {

        console.log(data)

        if (data === 'resend') {
            try {
                const response = await apiRequestForm({
                    name: nameValue,
                    surname: surnameValue,
                    country: country,
                    email: emailValue
                })

                console.log(response)

                if (response.detail === "request_created") {
                    setIsRequest(true)
                }
            } catch (e) {
                console.log(e.response.data)

                if (e.response.data.detail === 'request_already_exists') {
                    setErrorWidget('errorRequestAlreadyExists')
                } else if (e.response.data.detail === 'email_code_error') {
                    setErrorWidget('errorEmailCodeError')
                } else {
                    setErrorWidget(e.response.data.detail)
                }
            }
        }

        if (isRequest === false) {
            console.log(country)
            try {
                const response = await apiRequestForm({
                    name: data.name,
                    surname: data.surname,
                    country: country !== undefined ? country : data.country.value,
                    email: data.email
                })

                console.log(response)

                if (response.detail === "request_created") {
                    setIsRequest(true)
                }

            } catch (e) {
                console.log(e.response.data.detail)

                if (e.response.data.detail === 'request_already_exists') {
                    setErrorWidget('errorRequestAlreadyExists')
                } else if (e.response.data.detail === 'email_code_error') {
                    setErrorWidget('errorEmailCodeError')
                } else {
                    setErrorWidget(e.response.data.detail)
                }
            }
        } else if (isRequest === true && hash === false && data !== 'resend') {
            try {
                const response = await apiConfirmEmail({
                    email: emailValue,
                    code: emailCode
                })

                console.log(response)

                setHash(response.hash)
            } catch (e) {
                console.log(e.response.data)

                if (e.response.data.detail === undefined) {
                    if (e.response.data.code !== undefined) {
                        setErrorMailCode('errorEmailCodeEmpty')
                    } else {
                        setErrorWidget('undefined')
                    }
                } else if (e.response.data.detail === 'request_not_found') {
                    setErrorWidget('errorRequestNotFound')
                } else if (e.response.data.detail === 'invalid_code') {
                    setErrorMailCode('errorEmailCode')
                } else {
                    setErrorMailCode(e.response.data.detail)
                }
            }
        } else if (isRequestSms === true && data !== 'resendSms') {
            try {
                const response = await apiConfirmSms({
                    hash: hash,
                    email: emailValue,
                    phone: phoneValue,
                    code: phoneCode
                })

                console.log(response)

                if (response) {
                    setIsValidateForm(true)
                }

                console.log('Registration success!')

            } catch (e) {
                console.log(e.response.data)

                if (e.response.data.detail === undefined) {
                    if (e.response.data.code !== undefined) {
                        setErrorPhoneCode('errorPhoneCodeEmpty')
                    } else {
                        setErrorWidget('undefined')
                    }
                } else if (e.response.data.detail === 'request_not_found') {
                    setErrorWidget('errorRequestNotFound')
                } else if (e.response.data.detail === 'wrong_sms_code') {
                    setErrorPhoneCode('errorPhoneCode')
                } else {
                    setErrorPhoneCode(e.response.data.detail)
                }
            }
        } else if ((hash && data !== 'resend') || data === 'resendSms') {

            console.log('data: ', {
                hash: hash,
                email: emailValue,
                phone: phoneValue
            })

            try {
                const response = await apiRequestSms({
                    hash: hash,
                    email: emailValue,
                    phone: phoneValue
                })

                console.log(response)
                if (response) {
                    console.log('set Request')
                    setIsRequestSms(true)
                }
            } catch (e) {
                console.log(e.response.data)
                
                if (e.response.data.detail === 'phone_used') {
                    setErrorWidget('errorPhoneUsed')
                    setPhoneIsUsed(true)
                } else if (e.response.data.detail === 'request_not_found') {
                    setErrorWidget('errorRequestNotFound')
                } else if (e.response.data.detail === 'error_sms_code') {
                    setErrorWidget('errorSmsCode')
                } else if (e.response.data.detail === undefined) {
                    setErrorWidget('undefined')
                } else {
                    setErrorWidget(e.response.data.detail)
                }
            }
        }
    }

    const [triggerCounterEmail, setTriggerCounterEmail] = useState(false)

    const handleResendEmailCode = () => {
        if (triggerCounterEmail === false) {
            setIsRequest(false)
            setEmailCode(null)
            setHash(false)

            setTriggerCounterEmail(true)

            handleSendValue('resend')
        } else {
            setErrorWidget('errorTimeOut')
        }
    }

    const [triggerCounterPhone, setTriggerCounterPhone] = useState(false)

    const handleResendPhoneCode = () => {
        if (triggerCounterPhone === false) {
            setTriggerCounterPhone(true)

            handleSendValue('resendSms')
        } else {
            setErrorWidget('errorTimeOut')
        }
    }

    const [counterEmail, setCounterEmail] = useState(30)

    useEffect(() => {
        if (triggerCounterEmail) {
            counterEmail > 0 && setTimeout(() => setCounterEmail(counterEmail - 1), 1000)
        }

        if (counterEmail === 0) {
            setTriggerCounterEmail(false)
            setCounterEmail(30)
        }
    }, [counterEmail, triggerCounterEmail])

    const [counterPhone, setCounterPhone] = useState(30)

    useEffect(() => {
        if (triggerCounterPhone) {
            counterPhone > 0 && setTimeout(() => setCounterPhone(counterPhone - 1), 1000)
        }

        if (counterPhone === 0) {
            setTriggerCounterPhone(false)
            setCounterPhone(30)
        }
    }, [counterPhone, triggerCounterPhone])

    return (
        <div className="home widget">
            <Headline
                className="headline--widget"
                title={t('Main.widget.title')}
                caption={t('Main.widget.caption')}
                sequence={1}
            />
            {
                isValidateForm &&
                <div className="success">
                    {t('Main.widget.success')}
                </div>
            }
            <FormContext {...methods} >
                <form
                    className="form form--widget"
                    style={{"display": isValidateForm ? "none" : ""}}
                    onSubmit={handleSubmit(handleSendValue)}
                >
                    <div className="form__fields">
                        <div className="form__container">
                            <div className="form__item-container form__item-container--names">
                                <Controller
                                    as={Input}
                                    id="form__name"
                                    classNameContainer="form__item--name-container"
                                    className="form__item--name"
                                    type="text"
                                    placeholder={t('Main.widget.input1.text')}
                                    name="name"
                                    defaultValue={defaultValues.name}
                                    errors={errors}
                                    control={methods.control}
                                    onInput={handleSetInputValue}
                                    rules={{
                                        required: {
                                            value: true,
                                            message: t('Main.widget.input1.error')
                                        },
                                        maxLength: {
                                            value: 100,
                                            message: "Error... max"
                                        }
                                    }}
                                />
                                <Controller
                                    as={Input}
                                    id="form__lastname"
                                    classNameContainer="form__item--lastname-container"
                                    className="form__item--lastname"
                                    type="text"
                                    placeholder={t('Main.widget.input6.text')}
                                    name="surname"
                                    defaultValue={defaultValues.surname}
                                    errors={errors}
                                    control={methods.control}
                                    onInput={handleSetInputValue}
                                    rules={{
                                        required: {
                                            value: true,
                                            message: t('Main.widget.input6.error')
                                        },
                                        maxLength: {
                                            value: 100,
                                            message: "Error... max"
                                        }
                                    }}
                                />
                            </div>
                            {/* Select */}
                            <Controller
                                as={ReactSelect}
                                options={countriesFiltered}
                                defaultValue={CZECH_REPUBLIC}
                                errors={errors}
                                name="country"
                                id="form__country"
                                classNameContainer="form__item--country-container"
                                className="form--select form__item--country"
                                control={methods.control}
                                onChange={(event) => {setCountry(event[0].value)}}
                            />
                            {/* Select */}
                        </div>
                        <div className="form__container">
                            <Controller
                                as={Input}
                                id="form__email"
                                classNameContainer="form__item--email-container"
                                className="form__item--email"
                                type="text"
                                placeholder={t('Main.widget.input2.text')}
                                name="email"
                                defaultValue={defaultValues.email}
                                errors={errors}
                                disabled={hash}
                                onInput={handleSetInputValue}
                                message={{
                                    text: isRequest && !errors.email && !hash ? t('Main.widget.input2.success') : null,
                                    className: "send-message send-message--success"
                                }}
                                rules={{
                                    required: {
                                        value: true,
                                        message: t('Main.widget.input2.error')
                                    },
                                    pattern: {
                                        value: /^[A-Za-z0-9_.-]+@[^.]+\..{1,63}[^.].*/,
                                        message: t('Main.widget.errorEmail')
                                    }
                                }}
                            />
                            <div className="form__item-container form__item-container--email">
                                <Controller
                                    as={Input}
                                    id="form__email-code"
                                    type="text"
                                    placeholder={t('Main.widget.input3.text')}
                                    name="emailCode"
                                    defaultValue={defaultValues.emailCode}
                                    errors={errors}
                                    disabled={!isRequest || hash}
                                    onInput={handleSetCode}
                                    message={{
                                        text: errorMailCode !== null && hash === false ? t(`Main.widget.${errorMailCode}`) : null,
                                        className: "send-message send-message--error"
                                    }}
                                    rules={{
                                        pattern: {
                                            value: /^\d+$/,
                                            message: t('Main.widget.errorEmailCodeType')
                                        },
                                        minLength: {
                                            value: 6,
                                            // message: t('Main.widget.errorEmailCode')
                                        },
                                        maxLength: {
                                            value: 6,
                                            message: t('Main.widget.errorEmailCode')
                                        }
                                    }}
                                />
                                <button
                                    disabled={hash}
                                    type="submit"
                                    className={`button--widget-code ${emailValue !== null && !errors.email ? 'button--widget-code--active' : ''}`}
                                >
                                    {
                                        isRequest === false
                                        ? t('Main.widget.button.text3')
                                        : t('Main.widget.button.text')
                                    }
                                </button>
                                {
                                    isRequest && !hash
                                    ? <span
                                            className={`button--widget-code--resend ${triggerCounterEmail ? 'button--widget-code--disable' : ''}`}
                                            onClick={handleResendEmailCode}
                                      >
                                        {t('Main.widget.button.text2')}
                                        {
                                            (counterEmail === 0 || counterEmail === 30) && triggerCounterEmail === false
                                            ? null
                                            : counterEmail
                                        }
                                    </span>
                                    : null
                                }
                            </div>
                        </div>
                        {
                            // if send e-mail code
                            hash !== false
                            ? <div className="form__container">
                                <div className="form__item-container">
                                    <Controller
                                        as={Input}
                                        id="form__phone"
                                        className="form__item--phone"
                                        type="text"
                                        placeholder={t('Main.widget.input4.text')}
                                        name="phone"
                                        defaultValue={defaultValues.phone}
                                        errors={errors}
                                        control={methods.control}
                                        onInput={handleSetInputValue}
                                        message={{
                                            text: (isRequestSms && !phoneIsUsed && !errors.phone) ? t('Main.widget.input4.success') : null,
                                            className: "send-message send-message--success",
                                        }}
                                        rules={{
                                            required: {
                                                value: true,
                                                message: t('Main.widget.input4.error')
                                            },
                                            validate: val => !phoneValidation(val) ? t('Main.widget.errorPhone') : true
                                        }}
                                    />
                                </div>
                                <div className="form__item-container">
                                    <Controller
                                        as={Input}
                                        id="form__phone-code"
                                        type="text"
                                        placeholder={t('Main.widget.input5.text')}
                                        name="phoneCode"
                                        defaultValue={defaultValues.phoneCode}
                                        errors={errors}
                                        disabled={!isRequestSms}
                                        onInput={handleSetCode}
                                        message={{
                                            text: errorPhoneCode !== null ? t(`Main.widget.${errorPhoneCode}`) : null,
                                            className: "send-message send-message--error"
                                        }}
                                        rules={{
                                            pattern: {
                                                value: /^\d+$/,
                                                message: t('Main.widget.errorPhoneCodeType')
                                            },
                                            minLength: {
                                                value: 4,
                                                // message: t('Main.widget.errorPhoneCode')
                                            },
                                            maxLength: {
                                                value: 4,
                                                message: t('Main.widget.errorPhoneCode')
                                            }
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        className={`button--widget-code ${phoneValue !== null && !errors.phone ? 'button--widget-code--active' : ''}`}
                                    >
                                        {
                                            isRequestSms === false
                                            ? t('Main.widget.button.text3')
                                            : t('Main.widget.button.text')
                                        }
                                    </button>
                                    {
                                        isRequestSms
                                        ? <span
                                            style={isRequestSms && !phoneIsUsed && !errors.phone ? null : {bottom: "-20px"}}
                                            className={`button--widget-code--resend ${triggerCounterPhone ? 'button--widget-code--disable' : ''}`}
                                            onClick={handleResendPhoneCode}
                                        >
                                            {t('Main.widget.button.text2')}
                                            {
                                                (counterPhone === 0 || counterPhone === 30) && triggerCounterPhone === false
                                                ? null
                                                : counterPhone
                                            }
                                          </span>
                                        : null
                                    }
                                </div>
                            </div>
                            : null
                        }
                    </div>
                    {
                        errorWidget !== null
                        ? <span className="form__errors">
                            {t(`Main.widget.errors.${errorWidget}`)}
                          </span>
                        : null
                    }
                </form>
            </FormContext>
        </div>
    )
}

export default Widget
