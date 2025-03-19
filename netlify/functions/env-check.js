exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      mongodb_exists: !!process.env.MONGODB_URI,
      nextauth_url_exists: !!process.env.NEXTAUTH_URL,
      nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
      jwt_secret_exists: !!process.env.JWT_SECRET,
      next_public_app_url_exists: !!process.env.NEXT_PUBLIC_APP_URL,
      node_env: process.env.NODE_ENV
    })
  };
};
