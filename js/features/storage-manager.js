const ERROR_REASONS = {
    VALUE_NOT_FOUND: 'The provided key did not return any values.',
    UNSUCCESSFULLY_DELETE: 'It was not possible to delete the data, because it does not exist.',
    REWRITE_NOT_ALLOWED: 'Though the value exists in the storage, the rewrite was defined to "false". Set the rewrite to "true" and try again.',
    QUOTA_EXCEEDED_ERROR: 'The localStorage quota was exceeded or the permission to use it was revoked.'
}

class StorageManager {

    constructor(name) {
        this.storageContext = name
    }

    getAll() {

        const key = this.storageContext

        if(!key) {
            throw new Error('The key (arg0) must not be a  falsy value.')
        }

        const value = localStorage.getItem(key) || []

        return new Promise((resolve, reject) => {

            if(value && typeof value === 'string') {
                return resolve(JSON.parse(value))
            }

            if(value && Array.isArray(value)) {
                return resolve(value)
            }

            return reject(ERROR_REASONS.VALUE_NOT_FOUND)
        })
    }

    exists() {

        const key = this.storageContext

        return new Promise(async resolve => {
            try {
                await this.get(key)
                resolve(true)
            } catch(err) {
                resolve(false)
            }
        })
    }

    async getIndex(questionId) {
        const allQuestions = await this.getAll()
        return allQuestions.findIndex(({ id }) => id == questionId)
    }

    async getById(questionId) {
        const questions = await this.getAll()
        return questions.find(({ id }) => id == questionId)
    }

    async update(questionId, { title, answers, answer }) {
        const questionIndex = await this.getIndex(questionId)
        const questionFound = (await this.getAll())[questionIndex]

        questionFound.title = title
        questionFound.answers = answers
        questionFound.answer = answer

        const updatedQuestions = (await this.getAll()).map(question => question.id == questionId ? questionFound : question)

        this.set(updatedQuestions, true)
    }

    async set(value, rewriteIfExists) {

        const key = this.storageContext
        const valueExists = await this.exists(key)

        if(valueExists && rewriteIfExists) {

            localStorage.setItem(key, JSON.stringify(value))

            const promise = new Promise(resolve => {
                resolve({
                    defined: true,
                    data: JSON.stringify(value)
                })
            })

            return promise
        }

        if(valueExists && !rewriteIfExists) {
            return new Promise((_, reject) => {
                reject(ERROR_REASONS.REWRITE_NOT_ALLOWED)
            })
        }

        if(!valueExists) {
            try {

                localStorage.setItem(key, JSON.stringify(value))
                return new Promise(resolve => resolve({
                    defined: true,
                    data: JSON.stringify(value)
                }))

            } catch(err) {
                return new Promise((_, reject) => {
                    reject(ERROR_REASONS.QUOTA_EXCEEDED_ERROR)
                })
            }
        }
    }

    async add(data) {

        const allData = await this.getAll()
        allData.push(data)

        await this.set(allData, true)
    }

    async delete(key) {

        const valueExists = await this.exists(key)

        if(!valueExists) {
            return new Promise((_, reject) => {
                reject(ERROR_REASONS.UNSUCCESSFULLY_DELETE)
            })
        }

        const promise = new Promise(resolve => {
            try {
                localStorage.removeItem(key)
                resolve({ deleted: true})
            } catch(err) {
                console.log(err)
            }
        })
        return promise
    }
}

export default StorageManager
