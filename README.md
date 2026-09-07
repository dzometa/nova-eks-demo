# nova-eks-demo — clúster EKS con pipeline de GitHub Actions

Archivos de apoyo del runbook. La guía completa con explicaciones está en el
artifact publicado; esto es solo el código listo para usar.

## Variables de sesión

```bash
export AWS_REGION=us-east-2
export CLUSTER=nova-demo
export ECR_REPO=nova-demo-app
export GH_REPO=mi-org/nova-eks-demo
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REGISTRY=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

## Secuencia

```bash
# 1. Clúster (15-20 min)
eksctl create cluster -f cluster.yaml
kubectl get nodes

# 2. ECR + primera imagen
#    (si falta package-lock.json:  npm install --package-lock-only)
aws ecr create-repository --repository-name $ECR_REPO \
  --image-scanning-configuration scanOnPush=true --region $AWS_REGION
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $REGISTRY
docker build -t $REGISTRY/$ECR_REPO:v1 .
docker push $REGISTRY/$ECR_REPO:v1

# 3. Manifiestos (en macOS: sed -i '' ...)
sed -i "s|ACCOUNT.dkr.ecr.us-east-2.amazonaws.com|$REGISTRY|" k8s/deployment.yaml
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml
kubectl -n demo rollout status deployment/web

# 4. AWS Load Balancer Controller
curl -o alb-iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://alb-iam-policy.json
eksctl create iamserviceaccount \
  --cluster=$CLUSTER --region=$AWS_REGION \
  --namespace=kube-system --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve
helm repo add eks https://aws.github.io/eks-charts && helm repo update
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$AWS_REGION

# 5. Ingress
kubectl apply -f k8s/ingress.yaml
export ALB=$(kubectl -n demo get ingress web \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$ALB

# 6. OIDC + rol + access entry
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
sed -i "s/ACCOUNT_ID/$ACCOUNT_ID/g" iam/trust-policy.json iam/deploy-policy.json
sed -i "s|mi-org/nova-eks-demo|$GH_REPO|" iam/trust-policy.json
aws iam create-role --role-name GitHubActionsEKSDeploy \
  --assume-role-policy-document file://iam/trust-policy.json
aws iam put-role-policy --role-name GitHubActionsEKSDeploy \
  --policy-name deploy --policy-document file://iam/deploy-policy.json

export ROLE_ARN=arn:aws:iam::$ACCOUNT_ID:role/GitHubActionsEKSDeploy
aws eks create-access-entry --cluster-name $CLUSTER --region $AWS_REGION \
  --principal-arn $ROLE_ARN --type STANDARD
aws eks associate-access-policy --cluster-name $CLUSTER --region $AWS_REGION \
  --principal-arn $ROLE_ARN \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy \
  --access-scope type=namespace,namespaces=demo
echo $ROLE_ARN   # guardalo como secret AWS_DEPLOY_ROLE_ARN en GitHub

# 7. Push y a mirar Actions
git push origin main
```

## Limpieza (el orden importa)

```bash
kubectl delete -f k8s/ingress.yaml          # PRIMERO, o el ALB queda huérfano
kubectl -n demo get ingress                 # esperar a que no quede ninguno
eksctl delete cluster --name $CLUSTER --region $AWS_REGION --wait
aws ecr delete-repository --repository-name $ECR_REPO --force
aws iam delete-role-policy --role-name GitHubActionsEKSDeploy --policy-name deploy
aws iam delete-role --role-name GitHubActionsEKSDeploy
aws iam delete-policy --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy
```

Después de limpiar, revisar a mano **EC2 → Load Balancers** y **VPC → NAT Gateways**.

## Costo

Encendido 24/7 ronda US$189/mes (control plane 73, 2× t3.medium 61, NAT 33,
ALB 18, ECR/EBS 4). Un lab de un día: US$5–7.

## Versiones

EKS 1.34 · `actions/checkout@v7` · `aws-actions/configure-aws-credentials@v6` ·
`aws-actions/amazon-ecr-login@v2` · chart `aws-load-balancer-controller` 1.17.x
