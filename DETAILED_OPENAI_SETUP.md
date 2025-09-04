# 🔑 Complete OpenAI API Key Setup Guide

This guide provides detailed instructions for creating an OpenAI account, setting up billing, and generating an API key for CeBot integration.

## 📋 Prerequisites

- Valid email address
- Credit card or PayPal account for billing
- Web browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Step 1: Create OpenAI Account

### 1.1 Visit OpenAI Platform
1. Open your web browser
2. Navigate to: **https://platform.openai.com/**
3. You'll see the OpenAI Platform homepage

### 1.2 Sign Up Process
1. **Click "Sign up"** (top-right corner)
2. **Choose sign-up method**:
   - **Email & Password** (recommended)
   - **Continue with Google**
   - **Continue with Microsoft**

#### Option A: Email & Password
1. Enter your **email address**
2. Create a **strong password** (8+ characters, mix of letters, numbers, symbols)
3. Click **"Continue"**
4. **Check your email** for verification
5. Click the **verification link** in the email
6. Return to the OpenAI platform

#### Option B: Google/Microsoft
1. Click your preferred option
2. Sign in with your existing Google/Microsoft account
3. Grant necessary permissions
4. You'll be redirected back to OpenAI

### 1.3 Complete Profile Setup
1. **Enter your name** (first and last name)
2. **Phone verification**:
   - Enter your phone number
   - Choose SMS or voice call
   - Enter the verification code sent to your phone
3. **Accept Terms of Service** and Privacy Policy
4. Click **"Continue"**

---

## 💳 Step 2: Set Up Billing

**⚠️ IMPORTANT**: OpenAI requires billing setup and credits purchase before you can use the API. Free tier has very limited access and may not work for testing.

### 2.1 Navigate to Billing
1. After logging in, click your **profile picture** (top-right)
2. Select **"Manage account"**
3. In the left sidebar, click **"Billing"**
4. You'll see your current usage and billing information

### 2.2 Add Payment Method
1. Click **"Add payment method"**
2. **Choose payment type**:
   - **Credit Card** (Visa, Mastercard, American Express)
   - **PayPal** (if available in your region)

#### Credit Card Setup
1. **Enter card details**:
   - Card number (16 digits)
   - Expiry date (MM/YY)
   - CVC/CVV (3-4 digits on back)
   - Cardholder name (exactly as on card)
2. **Billing address**:
   - Street address
   - City, State/Province
   - ZIP/Postal code
   - Country
3. Click **"Add payment method"**

#### PayPal Setup
1. Click **"PayPal"**
2. You'll be redirected to PayPal
3. **Log in to PayPal**
4. **Authorize the payment**
5. Return to OpenAI platform

### 2.3 Add Credits
1. **Click "Add credits"**
2. **Choose amount**:
   - **$5** - Good for testing (~2,500-8,000 messages)
   - **$10** - Recommended for initial development (~5,000-16,000 messages)
   - **$20** - For extended testing (~10,000-32,000 messages)
3. **Confirm purchase**
4. Wait for payment processing (usually instant)

### 2.4 Set Usage Limits (Recommended)
1. In Billing section, find **"Usage limits"**
2. **Set monthly limit**:
   - **Soft limit**: $5-10 (gets warning email)
   - **Hard limit**: $15-20 (stops API access)
3. **Add notification email** (your email address)
4. Click **"Save"**

---

## 🔐 Step 3: Generate API Key

### 3.1 Navigate to API Keys
1. In the left sidebar, click **"API keys"**
2. You'll see the API keys management page
3. Any existing keys will be listed here

### 3.2 Create New API Key
1. **Click "Create new secret key"**
2. **Name your key**:
   - Enter: `CeBot-Integration` (or similar descriptive name)
   - This helps you identify the key later
3. **Set permissions** (if available):
   - **Read**: For reading account info
   - **Write**: For making API calls (required)
   - Leave default settings if unsure
4. Click **"Create secret key"**

### 3.3 Copy and Secure Your API Key
1. **⚠️ CRITICAL**: The API key will only be shown **ONCE**
2. **Copy the entire key**:
   - It starts with `sk-`
   - Example format: `sk-aBcD1234567890eFgHiJkLmNoPqRsTuVwXyZ`
3. **Store securely**:
   - **DON'T** save in a text file on desktop
   - **DON'T** share via email or messaging
   - **DO** use a password manager
   - **DO** save in your project's `.env` file immediately

### 3.4 Test Your API Key
1. **Important**: Test immediately to ensure it works
2. We'll do this in the next step using the provided test script

---

## 🧪 Step 4: Verify Setup

### 4.1 Add API Key to CeBot
1. **Open your CeBot project**
2. **Navigate to**: `backend/.env`
3. **Add the line**:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
4. **Replace** `sk-your-actual-api-key-here` with your actual API key
5. **Save the file**

### 4.2 Test the Integration
1. **Open terminal** in your CeBot backend directory
2. **Run the test script**:
   ```bash
   cd backend
   node test-openai.js
   ```

3. **Expected successful output**:
   ```
   🧪 Testing OpenAI connection...
   
   ✅ OpenAI connection successful!
   📝 Test response:
   Hello! I can help you find transport routes in Cebu City...
   
   💰 Token usage:
      - Prompt tokens: 25
      - Completion tokens: 15
      - Total tokens: 40
      - Estimated cost: $0.000080
   ```

4. **If you see errors**:

   **❌ Error 429 - Quota Exceeded** (Most Common):
   ```
   ❌ OpenAI connection failed: 429 You exceeded your current quota
   ```
   **This means you need to add billing/credits to your OpenAI account**:
   - Go to https://platform.openai.com/account/billing
   - Add a payment method (credit card)
   - Purchase initial credits ($5-10 minimum)
   - Wait 5-10 minutes for processing
   - Try the test again

   **❌ Invalid API Key**:
   ```
   ❌ OpenAI connection failed: Invalid API key
   ```
   - Double-check the key in `.env` file
   - Ensure no extra spaces or characters
   - Verify key hasn't been revoked
   - Try generating a new key

   **❌ Rate Limit**:
   ```
   ❌ OpenAI connection failed: Rate limit exceeded
   ```
   - Wait 1 minute and try again
   - This is temporary, usually resolves quickly

---

## 📊 Step 5: Monitor Usage

### 5.1 Understanding Costs
- **Model**: GPT-3.5-turbo
- **Input cost**: $0.0010 per 1K tokens (~750 words)
- **Output cost**: $0.0020 per 1K tokens (~750 words)
- **Typical CeBot message**: 100-300 tokens
- **Cost per message**: $0.0002-$0.0006

### 5.2 Usage Dashboard
1. **Go to**: https://platform.openai.com/account/usage
2. **Monitor**:
   - Daily usage
   - Total costs
   - Remaining credits
3. **Set up alerts**:
   - Email notifications at 50%, 75%, 90% of limit
   - SMS alerts for approaching limits

### 5.3 Best Practices
- **Start with $5-10** for testing
- **Monitor daily** for the first week
- **Set conservative limits** initially
- **Scale up** based on actual usage

---

## 🔒 Security Best Practices

### 6.1 API Key Security
- **Never commit** API keys to Git/GitHub
- **Use environment variables** only
- **Rotate keys** every 3-6 months
- **Delete unused keys** immediately
- **Use different keys** for development/production

### 6.2 Environment File Security
1. **Ensure `.env` is in `.gitignore`**
2. **Never share** `.env` files
3. **Use separate keys** for team members
4. **Document** which keys are for what purpose

### 6.3 Usage Monitoring
- **Review usage** weekly
- **Watch for unusual patterns**
- **Set up alerts** for unexpected spikes
- **Keep backups** of important conversations

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### "You exceeded your current quota" (Error 429) - MOST COMMON
```bash
❌ OpenAI connection failed: 429 You exceeded your current quota, please check your plan and billing details
```
**This is the #1 issue for new users. It means billing is not set up properly.**

**Step-by-step solution**:
1. **Go to OpenAI Billing**: https://platform.openai.com/account/billing
2. **Check your current plan**: 
   - If you see "Free tier" - you need to upgrade
   - If you see "$0.00 remaining" - you need to add credits
3. **Add payment method**:
   - Click "Add payment method"
   - Enter credit card details
   - Verify billing address
4. **Purchase credits**:
   - Click "Add credits"
   - Start with $5-10 (minimum for API access)
   - Confirm purchase
5. **Wait for processing** (5-10 minutes)
6. **Try the test again**: `node test-openai.js`

**Important Notes**:
- Free tier gives very limited API access (often $0)
- You need to add a credit card to use the API properly
- Minimum practical amount is $5-10
- Credits don't expire

#### "Invalid API Key"
```bash
❌ OpenAI connection failed: Invalid API key
```
**Solutions**:
- Double-check the key in `.env` file
- Ensure no extra spaces or characters
- Verify key hasn't been revoked
- Try generating a new key

#### "Insufficient Quota"
```bash
❌ OpenAI connection failed: You exceeded your current quota
```
**Solutions**:
- Add more credits in billing section
- Check if payment method is valid
- Wait for credit processing (can take 5-10 minutes)
- Verify billing information

#### "Rate Limit Exceeded"
```bash
❌ OpenAI connection failed: Rate limit exceeded
```
**Solutions**:
- Wait 1 minute between requests
- Upgrade to paid plan for higher limits
- Reduce frequency of API calls
- Consider using local AI for testing

#### "Network Error"
```bash
❌ OpenAI connection failed: Network Error
```
**Solutions**:
- Check internet connection
- Verify firewall settings
- Try from different network
- Check OpenAI status: https://status.openai.com

---

## 📱 Mobile App Setup (Optional)

### For Mobile Testing
1. **Download OpenAI app** (iOS/Android)
2. **Log in** with same account
3. **Monitor usage** on the go
4. **Get notifications** for usage limits

---

## 💡 Pro Tips

### Cost Optimization
1. **Use GPT-3.5-turbo** instead of GPT-4 (cheaper)
2. **Limit token output** in your applications
3. **Cache common responses** when possible
4. **Use local AI** for simple queries

### Development Workflow
1. **Start with small limits** ($5-10)
2. **Test thoroughly** before production
3. **Monitor usage patterns** for 1-2 weeks
4. **Scale up** based on real usage
5. **Keep separate keys** for dev/staging/prod

### Team Management
1. **Create organization** for team access
2. **Use separate keys** per team member
3. **Set individual limits** per key
4. **Regular key rotation** schedule

---

## ✅ Verification Checklist

Before proceeding with CeBot integration:

- [ ] OpenAI account created and verified
- [ ] Phone number verified
- [ ] Payment method added and verified
- [ ] Initial credits purchased ($5-10 minimum)
- [ ] Usage limits set (soft: $5, hard: $10-15)
- [ ] API key generated and copied
- [ ] API key added to CeBot `.env` file
- [ ] Test script runs successfully
- [ ] Usage monitoring set up
- [ ] Billing alerts configured

---

## 📞 Support Resources

- **OpenAI Help Center**: https://help.openai.com/
- **API Documentation**: https://platform.openai.com/docs
- **Community Forum**: https://community.openai.com/
- **Status Page**: https://status.openai.com/
- **Billing Support**: support@openai.com

## 🎯 Next Steps

Once you've completed this setup:
1. **Test CeBot integration** with both AI models
2. **Compare response quality** between Local and OpenAI
3. **Monitor usage** for first week
4. **Adjust limits** based on actual usage patterns
5. **Deploy to production** with environment variables

**Expected setup time**: 15-20 minutes
**Initial cost**: $5-10 for testing
**Go-live ready**: Immediately after verification
