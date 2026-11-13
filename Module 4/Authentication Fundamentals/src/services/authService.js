const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const AppError = require('../errors/AppError');
const cost = Number(process.env.BCRYPT_COST || 12);
function requiredString(value) {
return typeof value === 'string' && value.trim().length > 0;
}
function publicUser(user) {
return { id: user.id, name: user.name, email: user.email };
}
function invalidCredentials() {
return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}
async function register(input = {}) {
if (!requiredString(input.name) || !requiredString(input.email) || !requiredString(input.password)) {
throw new AppError(400, 'INVALID_INPUT', 'Name, email, and password are required');
}
const email = input.email.trim().toLowerCase();
if (await userRepository.findByEmail(email)) {
throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
}
const passwordHash = await bcrypt.hash(input.password, cost);
try {
const user = await userRepository.create({
name: input.name.trim(),
email,
passwordHash,
});

return publicUser(user);
} catch (error) {
if (error.code === 'P2002') {
throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
}
throw error;
}
}
async function login(input = {}) {
if (!requiredString(input.email) || !requiredString(input.password)) {
throw new AppError(400, 'INVALID_INPUT', 'Email and password are required');
}
const email = input.email.trim().toLowerCase();
const user = await userRepository.findByEmail(email);
if (!user) throw invalidCredentials();
const valid = await bcrypt.compare(input.password, user.passwordHash);
if (!valid) throw invalidCredentials();
return publicUser(user);
}
module.exports = { register, login };