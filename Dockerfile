FROM okteto/node:16 as builder

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=development
ENV NODE_ENV $NODE_ENV
ARG PREVIEW="true"
ENV PREVIEW $PREVIEW
ARG VITE_FR_AM_URL
ARG VITE_FR_AM_COOKIE_NAME
ARG VITE_FR_OAUTH_PUBLIC_CLIENT
ARG VITE_FR_REALM_PATH
# Copy bashrc file for message
COPY bashrc /root/.bashrc

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
EXPOSE 8443 443

CMD [ "npm", "run", "dev" ]

# Copy all local files into the image

FROM builder as deploy 

WORKDIR /usr/src/app
ENV NODE_ENV=production
ARG PREVIEW="true"
ENV PREVIEW $PREVIEW
EXPOSE 3000
RUN ["npm", "run", "build"]
CMD ["node", "./build"]

