/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */
const fs = require('fs');
const Papa = require('papaparse');
/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const file = fs.readFileSync(filename, 'utf8');
    return Papa.parse(file, {
        header: true,
    });
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    const to_remove = new Set();

    for (const row of csv.data) {
        for (const [key, value] of Object.entries(row)) {
            if (value === '' && key !== 'user_gender') {
                to_remove.add(parseInt(row.review_id));
            }
        }

        row.review_id = parseInt(row.review_id);
        // row.app_name = row.app_name;
        // row.app_category = row.app_category;
        // row.review_text = row.review_text;
        // row.review_language = row.review_language;
        row.rating = parseFloat(row.rating);
        row.review_date = new Date(row.review_date);
        row.verified_purchase = row.verified_purchase === 'True';
        // row.device_type = row.device_type;
        row.num_helpful_votes = parseInt(row.num_helpful_votes);
        // row.app_version = row.app_version;
        row.user = {
            user_id: parseInt(row.user_id),
            user_age: parseInt(row.user_age),
            user_country: row.user_country,
            user_gender: row.user_gender,
        };

        delete row.user_id;
        delete row.user_age;
        delete row.user_country;
        delete row.user_gender;
    }

    csv.data = csv.data.filter((row) => !to_remove.has(row.review_id));

    return csv.data;
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4) {
        return 'positive';
    } else if (rating < 2) {
        return 'negative';
    } else {
        return 'neutral';
    }
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisApp(cleaned) {
    const object = {};
    const apps = new Set();

    for (const review of cleaned) {
        const app = review.app_name;

        if (!apps.has(app)) {
            apps.add(app);
            object[app] = {
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        object[app][labelSentiment(review)] += 1;
    }

    const resultArray = Object.keys(object).map((app) => {
        return {
            app_name: app,
            positive: object[app]['positive'],
            neutral: object[app]['neutral'],
            negative: object[app]['negative'],
        };
    });

    return resultArray;
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{review_language: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const object = {};
    const langs = new Set();

    for (const review of cleaned) {
        const lang = review.review_language;

        if (!langs.has(lang)) {
            langs.add(lang);
            object[lang] = {
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        object[lang][labelSentiment(review)] += 1;
    }

    const resultArray = Object.keys(object).map((lang) => {
        return {
            lang_name: lang,
            positive: object[lang]['positive'],
            neutral: object[lang]['neutral'],
            negative: object[lang]['negative'],
        };
    });

    return resultArray;
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const num_ratings = {};

    for (const review of cleaned) {
        const app = review.app_name;
        if (!(app in num_ratings)) {
            num_ratings[app] = 0;
        }
        num_ratings[app] += 1;
    }

    let max_reviews = 0;
    let most_reviewed_app = null;

    for (const [app, num] of Object.entries(num_ratings)) {
        if (num > max_reviews) {
            max_reviews = num;
            most_reviewed_app = app;
        }
    }

    const app_reviews = cleaned.filter(
        (review) => review.app_name === most_reviewed_app,
    );

    const device_count = {};
    for (const review of app_reviews) {
        const device = review.device_type;
        if (!(device in device_count)) {
            device_count[device] = 0;
        }
        device_count[device] += 1;
    }

    let max_count = 0;
    let most_common_device = null;

    for (const [device, num] of Object.entries(device_count)) {
        if (num > max_count) {
            max_count = num;
            most_common_device = device;
        }
    }

    let avg_rating = 0.0;
    for (const review of app_reviews) {
        avg_rating += review.rating;
    }
    avg_rating = avg_rating / app_reviews.length;

    return {
        mostReviewedApp: most_reviewed_app,
        mostReviews: max_reviews,
        mostUsedDevice: most_common_device,
        mostDevices: max_count,
        avgRating: avg_rating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
