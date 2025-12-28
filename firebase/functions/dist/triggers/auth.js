"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDeleted = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// 🟢 [추가] 유저 생성 트리거
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    try {
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            nickname: user.displayName || 'User',
            photoURL: user.photoURL || null,
            role: 'user', // 기본 권한
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`User created: ${user.uid}`);
    }
    catch (error) {
        console.error('Error creating user document:', error);
    }
});
// 🟢 [추가] 유저 삭제 트리거
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    try {
        await db.collection('users').doc(user.uid).delete();
        console.log(`User deleted: ${user.uid}`);
    }
    catch (error) {
        console.error('Error deleting user document:', error);
    }
});
//# sourceMappingURL=auth.js.map